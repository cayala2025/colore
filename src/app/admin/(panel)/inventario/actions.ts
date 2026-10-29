"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { parseBreakage, parseCount, parseNewProduct, parseProductEdit, priceOrder, skuFromName, type ErrorKey, type NewProduct, type OrderLine, type ProductEdit } from "@/lib/finance/inventoryInput";
import { loadProducts, loadSettings } from "@/lib/finance/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayInStudio } from "@/lib/time";

export type FormResult = { ok: true } | { ok: false; error: ErrorKey | "generic" };

const db = () => supabaseAdmin();
const done = (): FormResult => {
  refresh();
  return { ok: true };
};
const fail = (error: ErrorKey | "generic"): FormResult => ({ ok: false, error });

export async function createOrderAction(lines: OrderLine[], notes: string): Promise<FormResult> {
  const admin = await requireAdmin();
  const [products, settings] = await Promise.all([loadProducts(), loadSettings()]);
  const priced = priceOrder(lines, products, settings.fxRate);
  if (!priced.ok) return fail(priced.error);

  const { data: order, error } = await db()
    .from("purchase_orders")
    .insert({
      ordered_on: todayInStudio(),
      status: "ordered",
      total_usd: priced.totalUsd,
      total_mxn: priced.totalMxn,
      fx_rate: settings.fxRate,
      notes: notes.trim().slice(0, 300) || null,
      created_by: admin.email,
    })
    .select("id")
    .single();
  if (error || !order) return fail("generic");

  const { error: itemsError } = await db()
    .from("purchase_order_items")
    .insert(priced.lines.map((l) => ({ purchase_order_id: order.id, product_id: l.productId, cases: l.cases, pieces: l.pieces, cost_usd: l.costUsd })));
  if (itemsError) {
    // Nothing is deleted: an order without lines is cancelled so it counts for nothing.
    await db().from("purchase_orders").update({ status: "cancelled", notes: "Error al guardar las piezas" }).eq("id", order.id);
    return fail("generic");
  }
  return done();
}

export async function receiveOrderAction(orderId: string): Promise<FormResult> {
  await requireAdmin();
  const { error } = await db()
    .from("purchase_orders")
    .update({ status: "received", received_on: todayInStudio() })
    .eq("id", orderId)
    .eq("status", "ordered");
  return error ? fail("generic") : done();
}

export async function cancelOrderAction(orderId: string): Promise<FormResult> {
  await requireAdmin();
  const { error } = await db().from("purchase_orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "ordered");
  return error ? fail("generic") : done();
}

export async function recordBreakageAction(productId: string, qty: number, reason: string): Promise<FormResult> {
  const admin = await requireAdmin();
  const parsed = parseBreakage(productId, qty, reason, await loadProducts());
  if (!parsed.ok) return fail(parsed.error);
  const { error } = await db()
    .from("inventory_adjustments")
    .insert({ product_id: productId, quantity: parsed.quantity, reason: parsed.reason, created_by: admin.email });
  return error ? fail("generic") : done();
}

export async function saveCountAction(counts: Record<string, number | null>, note: string): Promise<FormResult> {
  const admin = await requireAdmin();
  const parsed = parseCount(counts, await loadProducts());
  if (!parsed.ok) return fail(parsed.error);
  const { data: count, error } = await db()
    .from("inventory_counts")
    .insert({ counted_on: todayInStudio(), note: note.trim().slice(0, 300) || null, created_by: admin.email })
    .select("id")
    .single();
  if (error || !count) return fail("generic");
  const { error: itemsError } = await db()
    .from("inventory_count_items")
    .insert(parsed.items.map((i) => ({ count_id: count.id, product_id: i.productId, quantity: i.quantity })));
  return itemsError ? fail("generic") : done();
}

export async function updateProductAction(edit: ProductEdit): Promise<FormResult> {
  await requireAdmin();
  const parsed = parseProductEdit(edit);
  if (!parsed.ok) return fail(parsed.error);
  const e = parsed.edit;
  const { error } = await db()
    .from("products")
    .update({
      price_mxn: e.priceMxn,
      cost_usd: e.costUsd,
      case_size: e.caseSize,
      case_cost_usd: e.caseCostUsd,
      active: e.active,
      weekly_demand_override: e.weeklyDemandOverride,
    })
    .eq("id", e.id);
  return error ? fail("generic") : done();
}

/** Adds a sellable piece. Pieces are never deleted (sales refer to them): turn "Activa" off to retire one. */
export async function createProductAction(input: NewProduct): Promise<FormResult> {
  await requireAdmin();
  const products = await loadProducts();
  const parsed = parseNewProduct(input, products);
  if (!parsed.ok) return fail(parsed.error);
  const p = parsed.product;
  const { error } = await db().from("products").insert({
    sku: skuFromName(p.name, products.map((x) => x.sku)),
    name: p.name,
    price_mxn: p.priceMxn,
    cost_usd: p.costUsd,
    case_size: p.caseSize,
    case_cost_usd: p.caseCostUsd,
    seasonal: p.seasonal,
    weekly_demand_override: p.weeklyDemandOverride,
    sort: products.reduce((n, x) => Math.max(n, x.sort), 0) + 1,
  });
  return error ? fail("generic") : done();
}
