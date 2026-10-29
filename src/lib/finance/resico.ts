// RESICO 2026 monthly table: income WITHOUT IVA → ISR rate.
export const RESICO_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 25_000, rate: 0.01 },
  { upTo: 50_000, rate: 0.011 },
  { upTo: 83_333.33, rate: 0.015 },
  { upTo: 208_333.33, rate: 0.02 },
  { upTo: 291_666.67, rate: 0.025 },
];

export type ResicoResult =
  | { exceedsCap: true; isr: null; rate: null; aboveTable: false }
  | { exceedsCap: false; isr: number; rate: number; aboveTable: boolean };

/**
 * ISR for a month. `ytdIncome` is the year-to-date income without IVA, including this month.
 * Above the annual cap the taxpayer leaves RESICO, so nothing is computed.
 */
export function resicoMonthly(monthIncome: number, ytdIncome: number, annualCap: number): ResicoResult {
  if (ytdIncome > annualCap) return { exceedsCap: true, isr: null, rate: null, aboveTable: false };
  const bracket = RESICO_BRACKETS.find((b) => monthIncome <= b.upTo);
  const rate = (bracket ?? RESICO_BRACKETS[RESICO_BRACKETS.length - 1]).rate;
  return { exceedsCap: false, isr: monthIncome * rate, rate, aboveTable: !bracket };
}
