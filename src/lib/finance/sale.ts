import type { PaymentMethod, Product } from "./types";

export const MAX_ITEMS_PER_TICKET = 30;

export type TicketLine = { productId: string; qty: number };
export type DiscountInput = { amount: number; reason: string };

/** Piece code typed at the counter ("c-42", "C-0042") → canonical "C-0042", or null if it is not a code. */
export function parsePieceCode(reference: string): string | null {
  const m = /^\s*c-?\s*(\d{1,6})\s*$/i.exec(reference);
  if (!m) return null;
  const n = Number(m[1]);
  return n < 1 ? null : `C-${String(n).padStart(Math.max(4, m[1].length), "0")}`;
}

export type TicketResult =
  | { ok: true; subtotal: number; discount: number; total: number; pieces: number }
  | { ok: false; error: "empty" | "tooMany" | "unknownProduct" | "badDiscount" | "reasonRequired" };

/** Price a ticket from the product list. Discount is an amount in MXN, never above the subtotal. */
export function priceTicket(lines: TicketLine[], products: Pick<Product, "id" | "priceMxn" | "active">[], discount?: DiscountInput | null): TicketResult {
  let subtotal = 0;
  let pieces = 0;
  for (const l of lines) {
    if (!Number.isInteger(l.qty) || l.qty < 1) return { ok: false, error: "empty" };
    const p = products.find((x) => x.id === l.productId && x.active);
    if (!p) return { ok: false, error: "unknownProduct" };
    subtotal += p.priceMxn * l.qty;
    pieces += l.qty;
  }
  if (pieces === 0) return { ok: false, error: "empty" };
  if (pieces > MAX_ITEMS_PER_TICKET) return { ok: false, error: "tooMany" };
  const amount = discount?.amount ?? 0;
  if (!Number.isFinite(amount) || amount < 0 || amount > subtotal) return { ok: false, error: "badDiscount" };
  if (amount > 0 && !discount?.reason.trim()) return { ok: false, error: "reasonRequired" };
  return { ok: true, subtotal, discount: amount, total: subtotal - amount, pieces };
}

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return v === "cash" || v === "card" || v === "transfer";
}
