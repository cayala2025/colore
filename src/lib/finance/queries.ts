import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toStudio } from "@/lib/time";
import { inventoryBucketBalance } from "./money";
import { settingsFromRow } from "./settings";
import { stockByProduct, type StockInputs } from "./stock";
import type { FinanceSettings, PaymentMethod, Product, SaleLite } from "./types";

const db = () => supabaseAdmin();
const num = (v: unknown) => Number(v);

/** The single finance_settings row (id = 1) as typed settings. */
export async function loadSettings(): Promise<FinanceSettings> {
  const { data, error } = await db().from("finance_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`finance_settings: ${error.message}`);
  return settingsFromRow(data);
}

/** Stored hash of the admin discount code (null = discounts disabled). */
export async function loadDiscountHash(): Promise<string | null> {
  const { data, error } = await db().from("finance_settings").select("discount_code_hash").eq("id", 1).maybeSingle();
  if (error) throw new Error(`finance_settings: ${error.message}`);
  return (data?.discount_code_hash as string | null) ?? null;
}

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await db().from("products").select("*").order("sort");
  if (error) throw new Error(`products: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    priceMxn: num(r.price_mxn),
    costUsd: num(r.cost_usd),
    caseSize: r.case_size,
    caseCostUsd: num(r.case_cost_usd),
    seasonal: r.seasonal,
    active: r.active,
    sort: r.sort,
    weeklyDemandOverride: r.weekly_demand_override === null ? null : num(r.weekly_demand_override),
  }));
}

/** Everything stockByProduct needs: latest count, received orders, non-voided sold items, adjustments. */
export async function loadStockInputs(): Promise<StockInputs> {
  const [counts, received, sold, adjustments] = await Promise.all([
    db().from("inventory_counts").select("id, counted_on").order("counted_on", { ascending: false }).order("created_at", { ascending: false }).limit(1),
    db().from("purchase_orders").select("received_on, purchase_order_items(product_id, pieces)").eq("status", "received"),
    db().from("sale_items").select("product_id, sales!inner(studio_date, voided_at)").is("sales.voided_at", null),
    db().from("inventory_adjustments").select("product_id, quantity, adjusted_at"),
  ]);
  for (const r of [counts, received, sold, adjustments]) if (r.error) throw new Error(r.error.message);

  let count: StockInputs["count"] = null;
  const latest = counts.data?.[0];
  if (latest) {
    const { data, error } = await db().from("inventory_count_items").select("product_id, quantity").eq("count_id", latest.id);
    if (error) throw new Error(error.message);
    count = { countedOn: latest.counted_on, quantities: Object.fromEntries((data ?? []).map((i) => [i.product_id, i.quantity])) };
  }
  return {
    count,
    received: (received.data ?? []).flatMap((o) =>
      (o.purchase_order_items as { product_id: string; pieces: number }[]).map((i) => ({ productId: i.product_id, receivedOn: o.received_on as string, pieces: i.pieces })),
    ),
    sold: (sold.data ?? []).map((s) => ({ productId: s.product_id, studioDate: (s.sales as unknown as { studio_date: string }).studio_date })),
    adjustments: (adjustments.data ?? []).map((a) => ({ productId: a.product_id, date: toStudio(new Date(a.adjusted_at)).date, quantity: a.quantity })),
  };
}

export async function loadStock(products: Product[]): Promise<Record<string, number>> {
  return stockByProduct(products.map((p) => p.id), await loadStockInputs());
}

/** A ticket as the admin reads it: voided tickets stay visible with who, when and why. */
export type SaleView = {
  id: string;
  time: string;
  slotLabel: string;
  paymentMethod: PaymentMethod;
  items: { name: string; qty: number }[];
  subtotal: number;
  discount: number;
  discountReason: string | null;
  total: number;
  reference: string | null;
  createdBy: string;
  voided: { at: string; time: string; reason: string; by: string | null } | null;
};

export async function loadSalesForDate(date: string): Promise<SaleView[]> {
  const { data, error } = await db()
    .from("sales")
    .select("*, sale_items(product_id, products(name))")
    .eq("studio_date", date)
    .order("sold_at", { ascending: false });
  if (error) throw new Error(`sales: ${error.message}`);
  return (data ?? []).map((s) => {
    const counts = new Map<string, number>();
    for (const i of s.sale_items as { products: { name: string } | null }[]) {
      const name = i.products?.name ?? "?";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return {
      id: s.id,
      time: toStudio(new Date(s.sold_at)).time,
      slotLabel: s.slot_label,
      paymentMethod: s.payment_method,
      items: [...counts].map(([name, qty]) => ({ name, qty })),
      subtotal: s.subtotal_mxn === null ? num(s.total_mxn) : num(s.subtotal_mxn),
      discount: num(s.discount_mxn ?? 0),
      discountReason: s.discount_reason,
      total: num(s.total_mxn),
      reference: s.reference,
      createdBy: s.created_by,
      voided: s.voided_at
        ? { at: s.voided_at, time: toStudio(new Date(s.voided_at)).time, reason: s.void_reason ?? "", by: s.voided_by }
        : null,
    };
  });
}

/** Piece id and booking link for a canonical code. Never returns customer data. */
export async function findPieceByCode(code: string): Promise<{ id: string; bookingId: string | null } | null> {
  const { data, error } = await db().from("pieces").select("id, booking_id").eq("code", code).maybeSingle();
  if (error) throw new Error(`pieces: ${error.message}`);
  return data ? { id: data.id, bookingId: data.booking_id } : null;
}

/** Tickets (with item snapshots) for a studio date range, voided ones included and flagged. */
export async function loadSaleLites(from: string, to: string): Promise<SaleLite[]> {
  const { data, error } = await db()
    .from("sales")
    .select("id, studio_date, slot_label, payment_method, total_mxn, voided_at, sale_items(product_id, unit_price_mxn, restock_cost_mxn)")
    .gte("studio_date", from)
    .lte("studio_date", to);
  if (error) throw new Error(`sales: ${error.message}`);
  return (data ?? []).map((s) => ({
    id: s.id,
    studioDate: s.studio_date,
    slotLabel: s.slot_label,
    paymentMethod: s.payment_method,
    totalMxn: num(s.total_mxn),
    voided: Boolean(s.voided_at),
    items: (s.sale_items as { product_id: string; unit_price_mxn: unknown; restock_cost_mxn: unknown }[]).map((i) => ({
      productId: i.product_id,
      unitPriceMxn: num(i.unit_price_mxn),
      restockCostMxn: num(i.restock_cost_mxn),
    })),
  }));
}

export type DailyClose = {
  studioDate: string;
  closed: boolean;
  closedBy: string;
  closedAt: string;
  reopenedAt: string | null;
  cashFloat: number;
  cashCounted: number | null;
  cashDiff: number | null;
  totalMxn: number;
  pieces: number;
  tickets: number;
  cash: number;
  card: number;
  transfer: number;
  taxes: number;
  inventory: number;
  fixed: number;
  profit: number;
  cardFee: number;
  fixedShortfall: number;
  checks: { counted: boolean; deposited: boolean; moved: boolean };
  notes: string | null;
};

export async function loadDailyClose(date: string): Promise<DailyClose | null> {
  const { data, error } = await db().from("daily_closes").select("*").eq("studio_date", date).maybeSingle();
  if (error) throw new Error(`daily_closes: ${error.message}`);
  if (!data) return null;
  const n = (v: unknown) => (v === null || v === undefined ? null : num(v));
  return {
    studioDate: data.studio_date,
    closed: data.reopened_at === null,
    closedBy: data.closed_by,
    closedAt: data.closed_at,
    reopenedAt: data.reopened_at,
    cashFloat: num(data.cash_float_mxn),
    cashCounted: n(data.cash_counted_mxn),
    cashDiff: n(data.cash_diff_mxn),
    totalMxn: num(data.total_mxn),
    pieces: data.pieces,
    tickets: data.tickets,
    cash: num(data.cash_mxn),
    card: num(data.card_mxn),
    transfer: num(data.transfer_mxn),
    taxes: num(data.taxes_mxn),
    inventory: num(data.inventory_mxn),
    fixed: num(data.fixed_mxn),
    profit: num(data.profit_mxn),
    cardFee: num(data.card_fee_mxn),
    fixedShortfall: num(data.fixed_shortfall_mxn),
    checks: { counted: data.check_counted, deposited: data.check_deposited, moved: data.check_moved },
    notes: data.notes,
  };
}

/** Dates in [from, to] that have non-voided sales and no active close. */
export async function pendingCloseDates(from: string, to: string): Promise<string[]> {
  const [sales, closes] = await Promise.all([
    db().from("sales").select("studio_date").gte("studio_date", from).lte("studio_date", to).is("voided_at", null),
    db().from("daily_closes").select("studio_date").gte("studio_date", from).lte("studio_date", to).is("reopened_at", null),
  ]);
  if (sales.error) throw new Error(sales.error.message);
  if (closes.error) throw new Error(closes.error.message);
  const closed = new Set((closes.data ?? []).map((c) => c.studio_date));
  return [...new Set((sales.data ?? []).map((s) => s.studio_date as string))].filter((d) => !closed.has(d)).sort();
}

/** Pieces ordered but not yet received, by product id. */
export async function loadOnOrder(): Promise<Record<string, number>> {
  const { data, error } = await db().from("purchase_orders").select("purchase_order_items(product_id, pieces)").eq("status", "ordered");
  if (error) throw new Error(`purchase_orders: ${error.message}`);
  const out: Record<string, number> = {};
  for (const o of data ?? []) {
    for (const i of o.purchase_order_items as { product_id: string; pieces: number }[]) out[i.product_id] = (out[i.product_id] ?? 0) + i.pieces;
  }
  return out;
}

/** Inventory bucket: "Inventario" of closed days minus purchase orders (not cancelled), in MXN. */
export async function loadInventoryBalance(): Promise<number> {
  const [closes, orders] = await Promise.all([
    db().from("daily_closes").select("inventory_mxn").is("reopened_at", null),
    db().from("purchase_orders").select("total_mxn").neq("status", "cancelled"),
  ]);
  if (closes.error) throw new Error(closes.error.message);
  if (orders.error) throw new Error(orders.error.message);
  return inventoryBucketBalance(
    (closes.data ?? []).map((c) => num(c.inventory_mxn)),
    (orders.data ?? []).map((o) => num(o.total_mxn)),
  );
}
