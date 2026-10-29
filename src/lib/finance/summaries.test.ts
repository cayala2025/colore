import { describe, expect, it } from "vitest";
import { weekRange } from "./slots";
import { kilnStatus, monthBounds, openDaysPerWeek, summarizeMonth, summarizeWeek } from "./summaries";
import { DEFAULT_SETTINGS as S, type SaleLite } from "./types";

const sale = (date: string, n = 1, method: SaleLite["paymentMethod"] = "cash", voided = false): SaleLite => ({
  id: `${date}-${n}-${method}`, studioDate: date, slotLabel: "16–18", paymentMethod: method, totalMxn: 300 * n, voided,
  items: Array.from({ length: n }, () => ({ productId: "taza", unitPriceMxn: 300, restockCostMxn: 91.21 })),
});

describe("summarizeWeek", () => {
  const days = weekRange("2026-10-29").days;
  it("counts pieces per day and flags unclosed days", () => {
    const w = summarizeWeek([sale("2026-10-29", 2), sale("2026-10-30", 1), sale("2026-10-30", 1, "cash", true)], days, ["2026-10-29"], S);
    expect(w.pieces).toBe(3);
    expect(w.perDay.find((d) => d.date === "2026-10-30")?.pieces).toBe(1);
    expect(w.unclosedDays).toEqual(["2026-10-30"]);
    expect(w.status).toBe("below");
    expect(w.split.fixedTarget).toBeCloseTo((97274 / 26) * 2, 2);
  });
  it("reaches the breakeven and target statuses", () => {
    expect(summarizeWeek([sale("2026-10-29", 141)], days, [], S).status).toBe("breakeven");
    expect(summarizeWeek([sale("2026-10-29", 221)], days, [], S).status).toBe("target");
  });
  it("derives 6 open days a week and the daily breakeven", () => {
    expect(openDaysPerWeek(S)).toBe(6);
    expect(summarizeWeek([], days, [], S).dailyBreakeven).toBeCloseTo(23.5, 1);
  });
});

describe("kilnStatus", () => {
  it.each([[100, "ok"], [252, "tight"], [280, "tight"], [281, "risk"]])("%d pieces → %s", (n, st) => expect(kilnStatus(n, S)).toBe(st));
});

describe("summarizeMonth", () => {
  it("computes IVA, RESICO ISR and profit with real expenses", () => {
    const month = [sale("2026-11-05", 100, "card")]; // 30,000 total
    const m = summarizeMonth(month, month, [1000, 500], S);
    expect(m.iva).toBeCloseTo(2222.22, 2);
    expect(m.incomeNoIva).toBeCloseTo(27777.78, 2);
    expect(m.resico).toMatchObject({ rate: 0.011 });
    const isr = 27777.78 * 0.011;
    expect(m.profit).toBeCloseTo(30000 - 2222.22 - isr - 9121 - 30000 * 0.04176 - 1500, 1);
    expect(m.expenses).toBe(1500);
  });
  it("warns at 80% of the annual cap and stops computing above it", () => {
    const big = [sale("2026-11-05", 1)];
    big[0].totalMxn = 3_300_000;
    expect(summarizeMonth(big, big, [], S).capWarning).toBe(true);
    big[0].totalMxn = 4_000_000;
    const m = summarizeMonth(big, big, [], S);
    expect(m.resico.exceedsCap).toBe(true);
  });
});

describe("monthBounds", () => {
  it("handles year end and leap February", () => {
    expect(monthBounds("2026-12")).toEqual({ first: "2026-12-01", last: "2026-12-31", yearStart: "2026-01-01" });
    expect(monthBounds("2028-02").last).toBe("2028-02-29");
  });
});
