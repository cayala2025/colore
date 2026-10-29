"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { verifyDiscountCode } from "@/lib/finance/discountCode";
import { findPieceByCode, loadDiscountHash, loadProducts, loadSettings } from "@/lib/finance/queries";
import { isPaymentMethod, parsePieceCode, priceTicket, type TicketLine } from "@/lib/finance/sale";
import { slotLabelFor } from "@/lib/finance/slots";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toStudio } from "@/lib/time";

export type SaleErrorKey =
  | "empty" | "tooMany" | "unknownProduct" | "badDiscount" | "reasonRequired"
  | "noDiscountCode" | "wrongCode" | "method" | "dayClosed" | "reasonMissing" | "generic";

export type SaleInput = {
  lines: TicketLine[];
  method: string;
  reference: string;
  discount?: { amount: number; reason: string; code: string } | null;
};

export type SaleResult = { ok: true; total: number; pieceNotFound: boolean } | { ok: false; error: SaleErrorKey };

function dbError(message: string): SaleErrorKey {
  if (message.includes("day_closed")) return "dayClosed";
  if (message.includes("bad_discount")) return "badDiscount";
  if (message.includes("unknown_product")) return "unknownProduct";
  if (message.includes("empty_sale")) return "empty";
  return "generic";
}

export async function createSaleAction(input: SaleInput): Promise<SaleResult> {
  const admin = await requireAdmin();
  if (!isPaymentMethod(input.method)) return { ok: false, error: "method" };

  const products = await loadProducts();
  const discount = input.discount && input.discount.amount > 0 ? input.discount : null;
  if (discount) {
    const hash = await loadDiscountHash();
    if (!hash) return { ok: false, error: "noDiscountCode" };
    if (!verifyDiscountCode(discount.code, hash)) return { ok: false, error: "wrongCode" };
  }
  const priced = priceTicket(input.lines, products, discount);
  if (!priced.ok) return { ok: false, error: priced.error };

  // The reference may be a piece code: link it (first item) and inherit its booking. Nothing about the customer is read.
  const code = parsePieceCode(input.reference);
  const piece = code ? await findPieceByCode(code) : null;

  const now = toStudio(new Date());
  const settings = await loadSettings();
  const items = input.lines.flatMap((l, li) =>
    Array.from({ length: l.qty }, (_, i) => ({ product_id: l.productId, piece_id: li === 0 && i === 0 ? (piece?.id ?? null) : null })),
  );

  const { error } = await supabaseAdmin().rpc("create_sale", {
    p_studio_date: now.date,
    p_slot_label: slotLabelFor(now.time, settings.slotGraceMinutes),
    p_payment_method: input.method,
    p_reference: input.reference.slice(0, 120),
    p_booking_id: piece?.bookingId ?? null,
    p_created_by: admin.email,
    p_items: items,
    p_discount_mxn: priced.discount,
    p_discount_reason: discount?.reason.trim().slice(0, 200) ?? null,
  });
  if (error) return { ok: false, error: dbError(error.message) };
  refresh();
  return { ok: true, total: priced.total, pieceNotFound: Boolean(code && !piece) };
}

export async function voidSaleAction(saleId: string, reason: string): Promise<{ ok: true } | { ok: false; error: SaleErrorKey }> {
  const admin = await requireAdmin();
  if (!reason.trim()) return { ok: false, error: "reasonMissing" };
  const { error } = await supabaseAdmin().rpc("void_sale", { p_sale_id: saleId, p_reason: reason.trim().slice(0, 200), p_voided_by: admin.email });
  if (error) return { ok: false, error: dbError(error.message) };
  refresh();
  return { ok: true };
}
