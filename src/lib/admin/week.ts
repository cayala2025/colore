import type { ScheduleSlotRow } from "../availability";
import { addDays, isoWeekday, weekdayMon0 } from "../calendar";
import { groupBookingsBySlot, type AdminBooking, type AdminSlot } from "./daySlots";

export type AdminWeekDay = { date: string; blocked: boolean; slots: AdminSlot[] };

/** Monday of the week that contains `date`. */
export function mondayOf(date: string): string {
  return addDays(date, -weekdayMon0(date));
}

export function buildWeek(
  monday: string,
  schedule: ScheduleSlotRow[],
  blockedDates: string[],
  bookings: AdminBooking[],
): AdminWeekDay[] {
  const blocked = new Set(blockedDates);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const daySchedule = schedule.filter((s) => s.weekday === isoWeekday(date));
    return {
      date,
      blocked: blocked.has(date),
      slots: groupBookingsBySlot(
        daySchedule,
        bookings.filter((b) => b.date === date),
      ),
    };
  });
}
