import { cashReconciliation, splitMoney, totalsOf, type MoneySplit } from "./money";
import type { FinanceSettings, SaleLite } from "./types";

export type DayCut = {
  pieces: number;
  tickets: number;
  total: number;
  cash: number;
  card: number;
  transfer: number;
  restock: number;
  split: MoneySplit;
  float: number;
  expectedCash: number;
  counted: number | null;
  cashDiff: number | null;
};

/** Everything the Día cut shows, from the day's sales. A day with no sales costs nothing (0 open days). */
export function buildDayCut(sales: SaleLite[], s: FinanceSettings, floatMxn: number, counted: number | null): DayCut {
  const t = totalsOf(sales);
  const split = splitMoney({ total: t.total, cardTotal: t.byMethod.card, restock: t.restock, openDays: t.tickets > 0 ? 1 : 0 }, s);
  const rec = cashReconciliation(floatMxn, t.byMethod.cash, counted);
  return {
    pieces: t.pieces,
    tickets: t.tickets,
    total: t.total,
    cash: t.byMethod.cash,
    card: t.byMethod.card,
    transfer: t.byMethod.transfer,
    restock: t.restock,
    split,
    float: floatMxn,
    expectedCash: rec.expected,
    counted,
    cashDiff: rec.diff,
  };
}

export type CloseChecks = { counted: boolean; deposited: boolean; moved: boolean };

/** Row values for the close_day RPC (snake_case = daily_closes columns). */
export function closeValues(cut: DayCut, checks: CloseChecks, notes: string): Record<string, unknown> {
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    pieces: cut.pieces,
    tickets: cut.tickets,
    total_mxn: r(cut.total),
    cash_mxn: r(cut.cash),
    card_mxn: r(cut.card),
    transfer_mxn: r(cut.transfer),
    cash_float_mxn: r(cut.float),
    cash_counted_mxn: cut.counted === null ? null : r(cut.counted),
    cash_diff_mxn: cut.cashDiff === null ? null : r(cut.cashDiff),
    taxes_mxn: r(cut.split.taxes),
    inventory_mxn: r(cut.split.inventory),
    fixed_mxn: r(cut.split.fixed),
    profit_mxn: r(cut.split.profit),
    card_fee_mxn: r(cut.split.cardFee),
    fixed_shortfall_mxn: r(cut.split.fixedShortfall),
    check_counted: checks.counted,
    check_deposited: checks.deposited,
    check_moved: checks.moved,
    notes: notes.trim() || null,
  };
}
