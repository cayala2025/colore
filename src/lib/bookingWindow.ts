import { addDays, daysBetween, monthOf, weekdayMon0 } from "./calendar";

/** Customers can book up to this many days ahead (inclusive). */
export const MAX_DAYS_AHEAD = 60;

/** True if the date is between today and today + MAX_DAYS_AHEAD (inclusive). */
export function isWithinBookingWindow(date: string, today: string): boolean {
  const diff = daysBetween(today, date);
  return diff >= 0 && diff <= MAX_DAYS_AHEAD;
}

export function isMonday(date: string): boolean {
  return weekdayMon0(date) === 0;
}

export function lastBookableDate(today: string): string {
  return addDays(today, MAX_DAYS_AHEAD);
}

/** Range of months the calendar can show. */
export function bookableMonths(today: string): { min: string; max: string } {
  return { min: monthOf(today), max: monthOf(lastBookableDate(today)) };
}
