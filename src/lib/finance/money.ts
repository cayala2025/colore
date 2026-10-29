import type { FinanceSettings, PaymentMethod, SaleLite } from "./types";

/** Cost to buy one more piece: USD cost × FX × (1 + waste) + supplies per piece. */
export function restockCost(costUsd: number, s: Pick<FinanceSettings, "fxRate" | "wasteRate" | "suppliesPerPieceMxn">): number {
  return costUsd * s.fxRate * (1 + s.wasteRate) + s.suppliesPerPieceMxn;
}

export type MoneySplit = {
  total: number;
  iva: number;
  isr: number;
  taxes: number;
  inventory: number;
  cardFee: number;
  fixedTarget: number;
  fixed: number;
  fixedShortfall: number;
  profit: number;
};

/**
 * The "apartados" of a period, in order: taxes (IVA + ISR estimate), inventory (restock cost of items sold),
 * then fixed costs (min of what is left and the target for `openDays`), then profit and cushion.
 * The terminal deducts the card fee before deposit, so it comes out of what is left before fixed costs.
 */
export function splitMoney(
  input: { total: number; cardTotal: number; restock: number; openDays: number },
  s: Pick<FinanceSettings, "ivaRate" | "isrRate" | "cardFeeRate" | "fixedMonthlyMxn" | "openDaysPerMonth">,
): MoneySplit {
  const iva = (input.total * s.ivaRate) / (1 + s.ivaRate);
  const isr = (input.total - iva) * s.isrRate;
  const taxes = iva + isr;
  const cardFee = input.cardTotal * s.cardFeeRate;
  const remaining = Math.max(0, input.total - taxes - input.restock - cardFee);
  const fixedTarget = (s.fixedMonthlyMxn / s.openDaysPerMonth) * input.openDays;
  const fixed = Math.min(remaining, fixedTarget);
  return {
    total: input.total,
    iva,
    isr,
    taxes,
    inventory: input.restock,
    cardFee,
    fixedTarget,
    fixed,
    fixedShortfall: Math.max(0, fixedTarget - fixed),
    profit: Math.max(0, remaining - fixed),
  };
}

export type SalesTotals = {
  pieces: number;
  tickets: number;
  total: number;
  byMethod: Record<PaymentMethod, number>;
  restock: number;
};

/** Totals of the non-voided tickets. */
export function totalsOf(sales: SaleLite[]): SalesTotals {
  const t: SalesTotals = { pieces: 0, tickets: 0, total: 0, byMethod: { cash: 0, card: 0, transfer: 0 }, restock: 0 };
  for (const sale of sales) {
    if (sale.voided) continue;
    t.tickets += 1;
    t.pieces += sale.items.length;
    t.total += sale.totalMxn;
    t.byMethod[sale.paymentMethod] += sale.totalMxn;
    t.restock += sale.items.reduce((sum, i) => sum + i.restockCostMxn, 0);
  }
  return t;
}

/** Expected cash = float + cash sales. `diff` is null until the drawer is counted. */
export function cashReconciliation(floatMxn: number, cashSales: number, counted: number | null) {
  const expected = floatMxn + cashSales;
  return { expected, diff: counted === null ? null : counted - expected };
}

/** Inventory bucket = "Inventario" from closed days minus purchase orders (MXN). */
export function inventoryBucketBalance(closedDaysInventory: number[], purchaseOrdersMxn: number[]): number {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return sum(closedDaysInventory) - sum(purchaseOrdersMxn);
}
