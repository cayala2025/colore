// Planned shapes for the Sprint 8 tables (see supabase/migrations/20261029*). Money is MXN unless named usd.

export type PaymentMethod = "cash" | "card" | "transfer";

export type FinanceSettings = {
  fxRate: number;
  wasteRate: number;
  suppliesPerPieceMxn: number;
  ivaRate: number;
  isrRate: number;
  cardFeeRate: number;
  fixedMonthlyMxn: number;
  openDaysPerMonth: number;
  cashFloatMxn: number;
  cushionTargetMxn: number;
  leadTimeWeeks: number;
  safetyWeeks: number;
  reviewWeeks: number;
  planWeeklyCustomers: number;
  weeklyBreakeven: number;
  weeklyTarget: number;
  monthlyBreakeven: number;
  kilnWeeklyMin: number;
  kilnWeeklyMax: number;
  resicoAnnualCap: number;
};

export const DEFAULT_SETTINGS: FinanceSettings = {
  fxRate: 18.5,
  wasteRate: 0.03,
  suppliesPerPieceMxn: 20.9,
  ivaRate: 0.08,
  isrRate: 0.02,
  cardFeeRate: 0.04176,
  fixedMonthlyMxn: 97274,
  openDaysPerMonth: 26,
  cashFloatMxn: 1000,
  cushionTargetMxn: 291822,
  leadTimeWeeks: 2,
  safetyWeeks: 1,
  reviewWeeks: 2,
  planWeeklyCustomers: 184,
  weeklyBreakeven: 141,
  weeklyTarget: 221,
  monthlyBreakeven: 609,
  kilnWeeklyMin: 210,
  kilnWeeklyMax: 280,
  resicoAnnualCap: 3_500_000,
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  priceMxn: number;
  costUsd: number;
  caseSize: number;
  caseCostUsd: number;
  seasonal: boolean;
  active: boolean;
  sort: number;
};

/** One non-voided sale ticket, with the snapshot numbers of its items. */
export type SaleLite = {
  id: string;
  studioDate: string;
  slotLabel: string;
  paymentMethod: PaymentMethod;
  totalMxn: number;
  voided: boolean;
  items: { productId: string; unitPriceMxn: number; restockCostMxn: number }[];
};
