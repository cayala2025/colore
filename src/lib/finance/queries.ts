import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toStudio } from "@/lib/time";
import { settingsFromRow } from "./settings";
import { stockByProduct, type StockInputs } from "./stock";
import type { FinanceSettings, PaymentMethod, Product } from "./types";

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
