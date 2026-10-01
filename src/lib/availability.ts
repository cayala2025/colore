import { isWithinBookingWindow } from "./bookingWindow";
import { addDays, isoWeekday } from "./calendar";
import { studioToUtc, todayInStudio } from "./time";
import type { BookingStatus, DayAvailability, DaySlot } from "./types";

export type ScheduleSlotRow = {
  weekday: number; // ISO 1 = Monday … 7 = Sunday
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  capacity: number;
  active: boolean;
};

export type BookingRow = {
  date: string;
  start_time: string;
  party_size: number;
  status: BookingStatus;
};

export type AvailabilityInput = {
  schedule: ScheduleSlotRow[];
  blockedDates: string[];
  bookings: BookingRow[];
  party: number;
  from: string; // inclusive "YYYY-MM-DD"
  to: string; // inclusive
  now: Date;
};

/** Statuses that hold seats. "attended" still occupies the slot if staff mark arrivals early. */
export const SEAT_HOLDING_STATUSES: BookingStatus[] = ["confirmed", "attended"];

const hhmm = (t: string) => t.slice(0, 5);

export function seatsTaken(bookings: BookingRow[], date: string, start: string): number {
  return bookings
    .filter((b) => b.date === date && hhmm(b.start_time) === start && SEAT_HOLDING_STATUSES.includes(b.status))
    .reduce((sum, b) => sum + b.party_size, 0);
}

/** A party fits when capacity - taken >= party. */
export function fits(slot: DaySlot, party: number): boolean {
  return slot.seatsLeft >= party;
}

export function computeAvailability(input: AvailabilityInput): DayAvailability[] {
  const { schedule, bookings, party, from, to, now } = input;
  const blocked = new Set(input.blockedDates);
  const today = todayInStudio(now);
  const days: DayAvailability[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (blocked.has(date) || !isWithinBookingWindow(date, today)) {
      days.push({ date, bookable: false, slots: [] });
      continue;
    }
    const weekday = isoWeekday(date);
    const slots: DaySlot[] = schedule
      .filter((s) => s.active && s.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .filter((s) => studioToUtc(date, s.start_time) > now) // already started → not bookable
      .map((s) => {
        const start = hhmm(s.start_time);
        const left = s.capacity - seatsTaken(bookings, date, start);
        return { start, end: hhmm(s.end_time), capacity: s.capacity, seatsLeft: Math.max(0, left) };
      });
    days.push({ date, bookable: slots.some((s) => fits(s, party)), slots });
  }
  return days;
}
