// Pure helpers for calendar dates as "YYYY-MM-DD" strings (no timezone involved).

const pad = (n: number) => String(n).padStart(2, "0");

export function isoDate(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}`;
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function toUtc(iso: string): Date {
  const { year, month, day } = parseIsoDate(iso);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(d: Date): string {
  return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayMon0(iso: string): number {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}

/** ISO weekday used by the DB: 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  return weekdayMon0(iso) + 1;
}

/** "YYYY-MM" for a date. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Month grid, Monday first. Leading cells before day 1 are null; the grid is padded
 * with trailing nulls to complete the last week.
 */
export function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = isoDate(y, m, 1);
  const cells: (string | null)[] = Array(weekdayMon0(first)).fill(null);
  for (let day = 1; day <= daysInMonth(month); day++) cells.push(isoDate(y, m, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
