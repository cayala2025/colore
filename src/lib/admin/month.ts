import type { ScheduleSlotRow } from "../availability";
import { daysInMonth, isoDate, isoWeekday, parseIsoDate } from "../calendar";
import { groupBookingsBySlot, type AdminBooking } from "./daySlots";

export type FullnessLevel = "empty" | "low" | "medium" | "high" | "full";

export type MonthSlot = { start: string; end: string; used: number; capacity: number };

export type MonthDay = {
  date: string;
  blocked: boolean;
  /** No active slots that day (e.g. Mondays). */
  closed: boolean;
  used: number;
  capacity: number;
  level: FullnessLevel;
  slots: MonthSlot[];
};

export type MonthSummary = {
  /** Confirmed + attended bookings. */
  bookings: number;
  people: number;
  noShows: number;
  busiest: { date: string; people: number } | null;
};

/** How full a day or slot is: empty, under 50%, under 85%, almost full, full. */
export function fullness(used: number, capacity: number): FullnessLevel {
  if (used <= 0) return "empty";
  if (capacity <= 0 || used >= capacity) return "full";
  const ratio = used / capacity;
  if (ratio < 0.5) return "low";
  if (ratio < 0.85) return "medium";
  return "high";
}

/** Every day of a month ("YYYY-MM") with seats used vs capacity, per slot and in total. */
export function buildMonth(
  month: string,
  schedule: ScheduleSlotRow[],
  blockedDates: string[],
  bookings: AdminBooking[],
): MonthDay[] {
  const { year, month: m } = parseIsoDate(`${month}-01`);
  const blocked = new Set(blockedDates);
  return Array.from({ length: daysInMonth(month) }, (_, i) => {
    const date = isoDate(year, m, i + 1);
    const slots = groupBookingsBySlot(
      schedule.filter((s) => s.weekday === isoWeekday(date)),
      bookings.filter((b) => b.date === date),
    ).map((s) => ({ start: s.start, end: s.end, used: s.used, capacity: s.capacity }));
    const used = slots.reduce((sum, s) => sum + s.used, 0);
    const capacity = slots.reduce((sum, s) => sum + s.capacity, 0);
    return {
      date,
      blocked: blocked.has(date),
      closed: capacity === 0 && used === 0,
      used,
      capacity,
      level: fullness(used, capacity),
      slots,
    };
  });
}

/** Totals for the month header. */
export function summarizeMonth(days: MonthDay[], bookings: AdminBooking[]): MonthSummary {
  const active = bookings.filter((b) => b.status === "confirmed" || b.status === "attended");
  const busiestDay = days.reduce<MonthDay | null>((best, d) => (d.used > (best?.used ?? 0) ? d : best), null);
  return {
    bookings: active.length,
    people: active.reduce((sum, b) => sum + b.party_size, 0),
    noShows: bookings.filter((b) => b.status === "no_show").length,
    busiest: busiestDay ? { date: busiestDay.date, people: busiestDay.used } : null,
  };
}
