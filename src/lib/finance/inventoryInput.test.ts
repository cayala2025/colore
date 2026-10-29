import { describe, expect, it } from "vitest";
import { parseBreakage, parseCount, parseProductEdit, priceOrder } from "./inventoryInput";

const products = [
  { id: "taza", caseSize: 12, caseCostUsd: 44.28, active: true },
  { id: "joyero", caseSize: 4, caseCostUsd: 15.65, active: true },
  { id: "old", caseSize: 4, caseCostUsd: 10, active: false },
];

describe("priceOrder", () => {
  it("turns cases into pieces and USD/MXN totals", () => {
    const r = priceOrder([{ productId: "taza", cases: 2 }, { productId: "joyero", cases: 0 }, { productId: "joyero", cases: 1 }], products, 18.5);
    expect(r).toMatchObject({ ok: true, totalUsd: 104.21, totalMxn: 1927.89 });
    if (r.ok) expect(r.lines).toEqual([
      { productId: "taza", cases: 2, pieces: 24, costUsd: 88.56 },
      { productId: "joyero", cases: 1, pieces: 4, costUsd: 15.65 },
    ]);
  });
  it("rejects empty, fractional and unknown", () => {
    expect(priceOrder([{ productId: "taza", cases: 0 }], products, 18.5)).toEqual({ ok: false, error: "empty" });
    expect(priceOrder([{ productId: "taza", cases: 1.5 }], products, 18.5)).toEqual({ ok: false, error: "invalid" });
    expect(priceOrder([{ productId: "old", cases: 1 }], products, 18.5)).toEqual({ ok: false, error: "unknownProduct" });
  });
});

describe("parseBreakage", () => {
  it("stores a negative quantity", () => {
    expect(parseBreakage("taza", 3, "broken", products)).toEqual({ ok: true, quantity: -3, reason: "broken" });
  });
  it("validates", () => {
    expect(parseBreakage("x", 1, "broken", products)).toEqual({ ok: false, error: "unknownProduct" });
    expect(parseBreakage("taza", 0, "broken", products)).toEqual({ ok: false, error: "invalid" });
    expect(parseBreakage("taza", 1, "stolen", products)).toEqual({ ok: false, error: "reasonInvalid" });
  });
});

describe("parseCount", () => {
  it("requires every active product and accepts zero", () => {
    expect(parseCount({ taza: 5, joyero: 0 }, products)).toEqual({ ok: true, items: [{ productId: "taza", quantity: 5 }, { productId: "joyero", quantity: 0 }] });
    expect(parseCount({ taza: 5 }, products)).toEqual({ ok: false, error: "missingCounts" });
    expect(parseCount({ taza: 5, joyero: null }, products)).toEqual({ ok: false, error: "missingCounts" });
    expect(parseCount({ taza: -1, joyero: 1 }, products)).toEqual({ ok: false, error: "invalid" });
  });
});

describe("parseProductEdit", () => {
  const ok = { id: "taza", priceMxn: 300, costUsd: 3.69, caseSize: 12, caseCostUsd: 44.28, active: true, weeklyDemandOverride: null };
  it("accepts a valid edit and a manual demand", () => {
    expect(parseProductEdit(ok).ok).toBe(true);
    expect(parseProductEdit({ ...ok, weeklyDemandOverride: 0 }).ok).toBe(true);
  });
  it("rejects bad numbers", () => {
    expect(parseProductEdit({ ...ok, priceMxn: -1 })).toEqual({ ok: false, error: "invalid" });
    expect(parseProductEdit({ ...ok, caseSize: 0 })).toEqual({ ok: false, error: "invalid" });
    expect(parseProductEdit({ ...ok, weeklyDemandOverride: -2 })).toEqual({ ok: false, error: "invalid" });
  });
});
