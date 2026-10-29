import { describe, expect, it } from "vitest";
import { reorderSuggestion, stockByProduct, weeklyDemand } from "./stock";

const settings = { leadTimeWeeks: 2, safetyWeeks: 1, reviewWeeks: 2 };

describe("stockByProduct", () => {
  it("applies the count, then later receipts, sales and adjustments", () => {
    const s = stockByProduct(["a", "b"], {
      count: { countedOn: "2026-10-28", quantities: { a: 100, b: 10 } },
      received: [
        { productId: "a", receivedOn: "2026-10-28", pieces: 50 }, // same day: already in the count
        { productId: "a", receivedOn: "2026-11-05", pieces: 12 },
      ],
      sold: [
        { productId: "a", studioDate: "2026-10-28" }, // not after the count
        { productId: "a", studioDate: "2026-10-30" },
        { productId: "a", studioDate: "2026-10-31" },
      ],
      adjustments: [{ productId: "a", date: "2026-11-01", quantity: -3 }],
    });
    expect(s).toEqual({ a: 100 + 12 - 2 - 3, b: 10 });
  });
});

describe("stockByProduct same-day timing", () => {
  const base = { received: [], adjustments: [] };
  it("subtracts a sale made after the count on the same day, not one made before", () => {
    const s = stockByProduct(["a"], {
      ...base,
      count: { countedOn: "2026-11-02", countedAt: "2026-11-02T18:00:00Z", quantities: { a: 10 } },
      sold: [
        { productId: "a", studioDate: "2026-11-02", soldAt: "2026-11-02T17:00:00Z" },
        { productId: "a", studioDate: "2026-11-02", soldAt: "2026-11-02T19:00:00Z" },
      ],
    });
    expect(s.a).toBe(9);
  });
  it("applies breakage recorded after the count", () => {
    const s = stockByProduct(["a"], {
      received: [],
      sold: [],
      count: { countedOn: "2026-11-02", countedAt: "2026-11-02T18:00:00Z", quantities: { a: 10 } },
      adjustments: [{ productId: "a", date: "2026-11-02", at: "2026-11-02T20:00:00Z", quantity: -2 }],
    });
    expect(s.a).toBe(8);
  });
});

describe("weeklyDemand", () => {
  const sold = (date: string, n: number, productId = "a") => Array.from({ length: n }, () => ({ productId, studioDate: date }));

  it("falls back to the plan split by count share with less than 2 complete weeks", () => {
    const d = weeklyDemand(["a", "b"], sold("2026-10-29", 5), { a: 75, b: 25 }, "2026-11-02", 100);
    expect(d.a).toEqual({ perWeek: 75, source: "plan" });
    expect(d.b).toEqual({ perWeek: 25, source: "plan" });
  });

  it("averages the complete weeks since the first sale (today is Mon 2026-11-16)", () => {
    // complete weeks: 10-26, 11-02, 11-09 (3 weeks since the first sale week)
    const items = [...sold("2026-10-27", 6), ...sold("2026-11-03", 3), ...sold("2026-11-10", 3), ...sold("2026-11-16", 40)];
    const d = weeklyDemand(["a"], items, { a: 1 }, "2026-11-16", 100);
    expect(d.a).toEqual({ perWeek: 4, source: "sales" });
  });

  it("caps the window at 4 weeks", () => {
    const items = [...sold("2026-09-01", 100), ...sold("2026-10-20", 8), ...sold("2026-10-27", 8), ...sold("2026-11-03", 8), ...sold("2026-11-10", 8)];
    const d = weeklyDemand(["a"], items, { a: 1 }, "2026-11-16", 100);
    expect(d.a).toEqual({ perWeek: 8, source: "sales" });
  });
});

describe("weeklyDemand manual override", () => {
  it("wins over the plan and keeps other products computed", () => {
    const d = weeklyDemand(["a", "b"], [], { a: 75, b: 25 }, "2026-11-02", 100, { a: 40, b: null });
    expect(d.a).toEqual({ perWeek: 40, source: "manual" });
    expect(d.b).toEqual({ perWeek: 25, source: "plan" });
  });
  it("accepts a manual zero", () => {
    expect(weeklyDemand(["a"], [], { a: 75 }, "2026-11-02", 100, { a: 0 }).a).toEqual({ perWeek: 0, source: "manual" });
  });
});

describe("reorderSuggestion", () => {
  const base = { demandPerWeek: 10, caseSize: 12, caseCostUsd: 44.28, seasonal: false };

  it("computes min and max", () => {
    const r = reorderSuggestion({ ...base, stock: 100, onOrder: 0 }, settings);
    expect(r).toMatchObject({ min: 30, max: 50, status: "Bien", casesToOrder: 0 });
  });

  it("orders whole cases up to max when at or below min", () => {
    const r = reorderSuggestion({ ...base, stock: 30, onOrder: 0 }, settings);
    expect(r.casesToOrder).toBe(2); // (50 - 30) / 12 → 1.67 → 2
    expect(r.status).toBe("Pedir");
    expect(r.costUsd).toBeCloseTo(88.56, 2);
  });

  it("counts what is already on order", () => {
    expect(reorderSuggestion({ ...base, stock: 20, onOrder: 24 }, settings).casesToOrder).toBe(0);
  });

  it("is urgent when stock covers less than the lead time", () => {
    expect(reorderSuggestion({ ...base, stock: 15, onOrder: 0 }, settings).status).toBe("Urgente");
  });

  it("never reorders seasonal products", () => {
    const r = reorderSuggestion({ ...base, stock: 0, onOrder: 0, seasonal: true }, settings);
    expect(r).toMatchObject({ status: "Temporada", casesToOrder: 0 });
  });
});
