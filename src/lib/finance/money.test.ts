import { describe, expect, it } from "vitest";
import { cashReconciliation, inventoryBucketBalance, restockCost, splitMoney, totalsOf } from "./money";
import { DEFAULT_SETTINGS as S, type SaleLite } from "./types";

describe("restockCost", () => {
  it("prices a Taza at 91.21", () => {
    expect(restockCost(3.69, S)).toBeCloseTo(91.21, 2);
  });
});

describe("splitMoney", () => {
  it("matches the anchor: one Taza by card, 1 open day", () => {
    const r = splitMoney({ total: 300, cardTotal: 300, restock: restockCost(3.69, S), openDays: 1 }, S);
    expect(r.iva).toBeCloseTo(22.22, 2);
    expect(r.isr).toBeCloseTo(5.56, 2);
    expect(r.inventory).toBeCloseTo(91.21, 2);
    expect(r.cardFee).toBeCloseTo(12.53, 2);
    expect(r.fixed).toBeCloseTo(168.48, 2);
    expect(r.profit).toBe(0);
    expect(r.fixedTarget).toBeCloseTo(3741.31, 2);
    expect(r.fixedShortfall).toBeCloseTo(3572.83, 2);
  });

  it("puts the surplus in profit once fixed costs are covered", () => {
    const r = splitMoney({ total: 10_000, cardTotal: 0, restock: 2_000, openDays: 1 }, S);
    expect(r.fixed).toBeCloseTo(3741.31, 2);
    expect(r.fixedShortfall).toBe(0);
    expect(r.profit).toBeGreaterThan(0);
  });

  it("never goes negative", () => {
    const r = splitMoney({ total: 100, cardTotal: 0, restock: 500, openDays: 1 }, S);
    expect(r.fixed).toBe(0);
    expect(r.profit).toBe(0);
  });
});

describe("totalsOf", () => {
  const sale = (over: Partial<SaleLite>): SaleLite => ({
    id: "s", studioDate: "2026-11-02", slotLabel: "16–18", paymentMethod: "cash", totalMxn: 300, voided: false,
    items: [{ productId: "p", unitPriceMxn: 300, restockCostMxn: 91.21 }], ...over,
  });
  it("skips voided tickets and splits by method", () => {
    const t = totalsOf([sale({}), sale({ paymentMethod: "card", totalMxn: 600, items: [{ productId: "p", unitPriceMxn: 300, restockCostMxn: 90 }, { productId: "p", unitPriceMxn: 300, restockCostMxn: 90 }] }), sale({ voided: true })]);
    expect(t).toMatchObject({ tickets: 2, pieces: 3, total: 900 });
    expect(t.byMethod).toEqual({ cash: 300, card: 600, transfer: 0 });
    expect(t.restock).toBeCloseTo(271.21, 2);
  });
});

describe("cashReconciliation", () => {
  it("expects float + cash sales", () => {
    expect(cashReconciliation(1000, 600, 1550)).toEqual({ expected: 1600, diff: -50 });
  });
  it("has no diff before counting", () => {
    expect(cashReconciliation(1000, 0, null).diff).toBeNull();
  });
});

describe("inventoryBucketBalance", () => {
  it("is closed-day inventory minus purchase orders", () => {
    expect(inventoryBucketBalance([100, 200], [250])).toBe(50);
  });
});
