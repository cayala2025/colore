import { describe, expect, it } from "vitest";
import { hashDiscountCode, verifyDiscountCode } from "./discountCode";
import { parsePieceCode, priceTicket } from "./sale";

const products = [
  { id: "taza", priceMxn: 300, active: true },
  { id: "joyero", priceMxn: 250, active: true },
  { id: "old", priceMxn: 100, active: false },
];

describe("priceTicket", () => {
  it("sums lines", () => {
    expect(priceTicket([{ productId: "taza", qty: 2 }, { productId: "joyero", qty: 1 }], products)).toEqual({ ok: true, subtotal: 850, discount: 0, total: 850, pieces: 3 });
  });
  it("applies a discount with a reason", () => {
    const r = priceTicket([{ productId: "taza", qty: 2 }], products, { amount: 100, reason: "Cumpleaños" });
    expect(r).toMatchObject({ ok: true, discount: 100, total: 500 });
  });
  it("rejects a discount without reason, above subtotal or negative", () => {
    const l = [{ productId: "taza", qty: 1 }];
    expect(priceTicket(l, products, { amount: 50, reason: "  " })).toEqual({ ok: false, error: "reasonRequired" });
    expect(priceTicket(l, products, { amount: 301, reason: "x" })).toEqual({ ok: false, error: "badDiscount" });
    expect(priceTicket(l, products, { amount: -1, reason: "x" })).toEqual({ ok: false, error: "badDiscount" });
  });
  it("rejects empty, unknown, inactive and oversize tickets", () => {
    expect(priceTicket([], products)).toEqual({ ok: false, error: "empty" });
    expect(priceTicket([{ productId: "nope", qty: 1 }], products)).toEqual({ ok: false, error: "unknownProduct" });
    expect(priceTicket([{ productId: "old", qty: 1 }], products)).toEqual({ ok: false, error: "unknownProduct" });
    expect(priceTicket([{ productId: "taza", qty: 31 }], products)).toEqual({ ok: false, error: "tooMany" });
    expect(priceTicket([{ productId: "taza", qty: 1.5 }], products)).toEqual({ ok: false, error: "empty" });
  });
});

describe("parsePieceCode", () => {
  it.each([["C-0042", "C-0042"], ["c-42", "C-0042"], [" C42 ", "C-0042"], ["C-12345", "C-12345"]])("%s → %s", (i, o) => expect(parsePieceCode(i)).toBe(o));
  it.each(["", "abc", "C-", "C-0", "transferencia 123", "C-12 x"])("%j is not a code", (i) => expect(parsePieceCode(i)).toBeNull());
});

describe("discount code", () => {
  it("verifies the right code only", () => {
    const h = hashDiscountCode("abcd1234");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(h).not.toContain("abcd1234");
    expect(verifyDiscountCode("abcd1234", h)).toBe(true);
    expect(verifyDiscountCode("abcd1235", h)).toBe(false);
    expect(verifyDiscountCode("", h)).toBe(false);
  });
  it("is disabled when nothing is stored", () => {
    expect(verifyDiscountCode("abcd", null)).toBe(false);
    expect(verifyDiscountCode("abcd", "garbage")).toBe(false);
  });
});
