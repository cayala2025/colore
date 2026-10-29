import { describe, expect, it } from "vitest";
import { buildDayCut, closeValues } from "./dayCut";
import { DEFAULT_SETTINGS as S, type SaleLite } from "./types";

const taza = (over: Partial<SaleLite> = {}): SaleLite => ({
  id: "s1", studioDate: "2026-11-02", slotLabel: "16–18", paymentMethod: "card", totalMxn: 300, voided: false,
  items: [{ productId: "taza", unitPriceMxn: 300, restockCostMxn: 91.21 }], ...over,
});

describe("buildDayCut", () => {
  it("reproduces the anchor for one Taza by card", () => {
    const c = buildDayCut([taza()], S, 1000, null);
    expect(c).toMatchObject({ pieces: 1, tickets: 1, total: 300, card: 300, cash: 0 });
    expect(c.split.fixed).toBeCloseTo(168.48, 1);
    expect(c.split.profit).toBe(0);
    expect(c.cashDiff).toBeNull();
  });

  it("checks the drawer: float + cash sales", () => {
    const c = buildDayCut([taza({ paymentMethod: "cash" })], S, 1000, 1290);
    expect(c.expectedCash).toBe(1300);
    expect(c.cashDiff).toBe(-10);
  });

  it("ignores voided tickets and charges no fixed cost for a day without sales", () => {
    const c = buildDayCut([taza({ voided: true })], S, 1000, null);
    expect(c.total).toBe(0);
    expect(c.split.fixedTarget).toBe(0);
  });
});

describe("closeValues", () => {
  it("rounds to cents and maps checks and notes", () => {
    const v = closeValues(buildDayCut([taza()], S, 1000, null), { counted: true, deposited: false, moved: false }, "  ok  ");
    expect(v).toMatchObject({ total_mxn: 300, card_fee_mxn: 12.53, cash_counted_mxn: null, check_counted: true, notes: "ok" });
  });
});
