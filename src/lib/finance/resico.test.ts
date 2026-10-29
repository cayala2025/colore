import { describe, expect, it } from "vitest";
import { resicoMonthly } from "./resico";

describe("resicoMonthly", () => {
  it.each([
    [25_000, 0.01],
    [25_000.01, 0.011],
    [50_000, 0.011],
    [83_333.33, 0.015],
    [100_000, 0.02],
    [208_333.33, 0.02],
    [250_000, 0.025],
  ])("income %d pays %d", (income, rate) => {
    const r = resicoMonthly(income, income, 3_500_000);
    expect(r.exceedsCap).toBe(false);
    expect(r.rate).toBe(rate);
    expect(r.isr).toBeCloseTo(income * rate, 6);
  });

  it("flags income above the table but under the cap", () => {
    const r = resicoMonthly(300_000, 300_000, 3_500_000);
    expect(r).toMatchObject({ rate: 0.025, aboveTable: true });
  });

  it("does not compute above the annual cap", () => {
    expect(resicoMonthly(100_000, 3_500_000.01, 3_500_000)).toEqual({ exceedsCap: true, isr: null, rate: null, aboveTable: false });
  });
});
