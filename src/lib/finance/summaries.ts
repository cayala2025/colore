import { addDays } from "../calendar";
import { splitMoney, totalsOf, type MoneySplit } from "./money";
import { resicoMonthly, type ResicoResult } from "./resico";
import type { FinanceSettings, SaleLite } from "./types";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const live = (sales: SaleLite[]) => sales.filter((s) => !s.voided);

/** Days of the period that have at least one non-voided ticket. */
export function daysWithSales(sales: SaleLite[]): string[] {
  return [...new Set(live(sales).map((s) => s.studioDate))].sort();
}

/** Studio open days per week implied by the monthly setting (26 per month ≈ 6 per week). */
export function openDaysPerWeek(s: Pick<FinanceSettings, "openDaysPerMonth">): number {
  return (s.openDaysPerMonth * 12) / 52;
}

export type WeekStatus = "below" | "breakeven" | "target";
export type KilnStatus = "ok" | "tight" | "risk";

export function kilnStatus(pieces: number, s: Pick<FinanceSettings, "kilnWeeklyMax">): KilnStatus {
  if (pieces > s.kilnWeeklyMax) return "risk";
  return pieces >= s.kilnWeeklyMax * 0.9 ? "tight" : "ok";
}

export type WeekSummary = {
  pieces: number;
  tickets: number;
  total: number;
  status: WeekStatus;
  perDay: { date: string; pieces: number }[];
  dailyBreakeven: number;
  split: MoneySplit;
  kiln: KilnStatus;
  /** Days with sales but no close. */
  unclosedDays: string[];
};

/** Customers are counted as pieces sold (one piece per painter). */
export function summarizeWeek(sales: SaleLite[], days: string[], closedDates: string[], s: FinanceSettings): WeekSummary {
  const t = totalsOf(sales);
  const withSales = daysWithSales(sales);
  const closed = new Set(closedDates);
  return {
    pieces: t.pieces,
    tickets: t.tickets,
    total: t.total,
    status: t.pieces >= s.weeklyTarget ? "target" : t.pieces >= s.weeklyBreakeven ? "breakeven" : "below",
    perDay: days.map((date) => ({ date, pieces: totalsOf(sales.filter((x) => x.studioDate === date)).pieces })),
    dailyBreakeven: s.weeklyBreakeven / openDaysPerWeek(s),
    split: splitMoney({ total: t.total, cardTotal: t.byMethod.card, restock: t.restock, openDays: withSales.length }, s),
    kiln: kilnStatus(t.pieces, s),
    unclosedDays: withSales.filter((d) => !closed.has(d)),
  };
}

export type MonthSummary = {
  pieces: number;
  tickets: number;
  total: number;
  iva: number;
  incomeNoIva: number;
  resico: ResicoResult;
  ytdIncomeNoIva: number;
  capUsedPct: number;
  capWarning: boolean;
  split: MoneySplit;
  expenses: number;
  /** Sales − IVA − ISR (RESICO) − restock − card fees − real expenses. */
  profit: number;
  customersVsBreakeven: number;
};

/** `ytdSales` = all sales of the year up to the end of the month (used for the annual cap). */
export function summarizeMonth(monthSales: SaleLite[], ytdSales: SaleLite[], expensesMxn: number[], s: FinanceSettings): MonthSummary {
  const t = totalsOf(monthSales);
  const iva = (t.total * s.ivaRate) / (1 + s.ivaRate);
  const incomeNoIva = t.total - iva;
  const ytdTotal = totalsOf(ytdSales).total;
  const ytdIncomeNoIva = ytdTotal - (ytdTotal * s.ivaRate) / (1 + s.ivaRate);
  const resico = resicoMonthly(incomeNoIva, ytdIncomeNoIva, s.resicoAnnualCap);
  const split = splitMoney({ total: t.total, cardTotal: t.byMethod.card, restock: t.restock, openDays: daysWithSales(monthSales).length }, s);
  const expenses = sum(expensesMxn);
  const isr = resico.isr ?? 0;
  const capUsedPct = (ytdIncomeNoIva / s.resicoAnnualCap) * 100;
  return {
    pieces: t.pieces,
    tickets: t.tickets,
    total: t.total,
    iva,
    incomeNoIva,
    resico,
    ytdIncomeNoIva,
    capUsedPct,
    capWarning: capUsedPct >= 80,
    split,
    expenses,
    profit: t.total - iva - isr - t.restock - split.cardFee - expenses,
    customersVsBreakeven: t.pieces - s.monthlyBreakeven,
  };
}

/** First and last day of a "YYYY-MM" month, and Jan 1 of its year. */
export function monthBounds(month: string): { first: string; last: string; yearStart: string } {
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { first, last: addDays(next, -1), yearStart: `${y}-01-01` };
}
