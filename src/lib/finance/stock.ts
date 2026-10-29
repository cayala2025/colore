import { addDays } from "../calendar";
import { mondayOf } from "../admin/week";
import type { FinanceSettings } from "./types";

export type StockInputs = {
  /** Latest physical count: date and quantity by product id. */
  count: { countedOn: string; quantities: Record<string, number> } | null;
  /** Received purchase orders. */
  received: { productId: string; receivedOn: string; pieces: number }[];
  /** Non-voided sold items. */
  sold: { productId: string; studioDate: string }[];
  /** Signed quantity changes (breakage is negative); date is the studio date. */
  adjustments: { productId: string; date: string; quantity: number }[];
};

/** Stock = latest count + received pieces after it − sold items after it + adjustments after it ("after" = later date). */
export function stockByProduct(productIds: string[], i: StockInputs): Record<string, number> {
  const since = i.count?.countedOn ?? "0000-00-00";
  const out: Record<string, number> = {};
  for (const id of productIds) {
    out[id] =
      (i.count?.quantities[id] ?? 0) +
      i.received.filter((r) => r.productId === id && r.receivedOn > since).reduce((n, r) => n + r.pieces, 0) -
      i.sold.filter((s) => s.productId === id && s.studioDate > since).length +
      i.adjustments.filter((a) => a.productId === id && a.date > since).reduce((n, a) => n + a.quantity, 0);
  }
  return out;
}

export type DemandSource = "sales" | "plan";

/**
 * Weekly demand per product. With ≥2 complete weeks since the first sale, it is the average of the last
 * up-to-4 complete weeks (Mon–Sun) of sales; otherwise the planned weekly customers split by each
 * product's share in the latest count.
 */
export function weeklyDemand(
  productIds: string[],
  sold: { productId: string; studioDate: string }[],
  countQuantities: Record<string, number>,
  today: string,
  planWeeklyCustomers: number,
): Record<string, { perWeek: number; source: DemandSource }> {
  const lastCompleteEnd = addDays(mondayOf(today), -1);
  const firstSale = sold.reduce<string | null>((min, s) => (min === null || s.studioDate < min ? s.studioDate : min), null);
  let weeks = 0;
  if (firstSale !== null && firstSale <= lastCompleteEnd) {
    const firstMonday = mondayOf(firstSale);
    const completeWeeks = Math.floor((Date.parse(`${addDays(lastCompleteEnd, 1)}T00:00:00Z`) - Date.parse(`${firstMonday}T00:00:00Z`)) / (7 * 86_400_000));
    weeks = Math.min(4, completeWeeks);
  }
  const out: Record<string, { perWeek: number; source: DemandSource }> = {};
  if (weeks >= 2) {
    const from = addDays(lastCompleteEnd, -7 * weeks + 1);
    for (const id of productIds) {
      const n = sold.filter((s) => s.productId === id && s.studioDate >= from && s.studioDate <= lastCompleteEnd).length;
      out[id] = { perWeek: n / weeks, source: "sales" };
    }
    return out;
  }
  const totalCount = productIds.reduce((n, id) => n + (countQuantities[id] ?? 0), 0);
  for (const id of productIds) {
    const share = totalCount > 0 ? (countQuantities[id] ?? 0) / totalCount : 0;
    out[id] = { perWeek: planWeeklyCustomers * share, source: "plan" };
  }
  return out;
}

export type ReorderStatus = "Bien" | "Pedir" | "Urgente" | "Temporada";

export type Reorder = {
  min: number;
  max: number;
  weeksOfCover: number | null;
  status: ReorderStatus;
  casesToOrder: number;
  costUsd: number;
};

/** Min/max reorder rule. Seasonal products are never reordered. */
export function reorderSuggestion(
  p: { stock: number; onOrder: number; demandPerWeek: number; caseSize: number; caseCostUsd: number; seasonal: boolean },
  s: Pick<FinanceSettings, "leadTimeWeeks" | "safetyWeeks" | "reviewWeeks">,
): Reorder {
  const min = p.demandPerWeek * (s.leadTimeWeeks + s.safetyWeeks);
  const max = min + p.demandPerWeek * s.reviewWeeks;
  const weeksOfCover = p.demandPerWeek > 0 ? p.stock / p.demandPerWeek : null;
  if (p.seasonal) return { min, max, weeksOfCover, status: "Temporada", casesToOrder: 0, costUsd: 0 };
  const position = p.stock + p.onOrder;
  if (position > min) return { min, max, weeksOfCover, status: "Bien", casesToOrder: 0, costUsd: 0 };
  const casesToOrder = Math.max(0, Math.ceil((max - position) / p.caseSize));
  const urgent = weeksOfCover !== null && weeksOfCover < s.leadTimeWeeks;
  return {
    min,
    max,
    weeksOfCover,
    status: casesToOrder === 0 ? "Bien" : urgent ? "Urgente" : "Pedir",
    casesToOrder,
    costUsd: casesToOrder * p.caseCostUsd,
  };
}
