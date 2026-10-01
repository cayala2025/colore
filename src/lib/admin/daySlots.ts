import { SEAT_HOLDING_STATUSES, type ScheduleSlotRow } from "../availability";
import type { BookingStatus } from "../types";

export type AdminBooking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  party_size: number;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  customer_confirmed_at: string | null;
  manage_token: string;
  date: string;
};

export type AdminSlot = {
  start: string; // HH:MM
  end: string;
  capacity: number;
  used: number;
  free: number;
  /** Booking exists for a time that is no longer in the schedule. */
  offSchedule: boolean;
  bookings: AdminBooking[];
};

const hhmm = (t: string) => t.slice(0, 5);

/** Group a day's bookings into its schedule slots (plus any off-schedule times), ordered by time. */
export function groupBookingsBySlot(schedule: ScheduleSlotRow[], bookings: AdminBooking[]): AdminSlot[] {
  const slots = new Map<string, AdminSlot>();
  for (const s of schedule.filter((x) => x.active)) {
    slots.set(hhmm(s.start_time), {
      start: hhmm(s.start_time),
      end: hhmm(s.end_time),
      capacity: s.capacity,
      used: 0,
      free: s.capacity,
      offSchedule: false,
      bookings: [],
    });
  }
  for (const b of bookings) {
    const key = hhmm(b.start_time);
    let slot = slots.get(key);
    if (!slot) {
      slot = { start: key, end: hhmm(b.end_time), capacity: 0, used: 0, free: 0, offSchedule: true, bookings: [] };
      slots.set(key, slot);
    }
    slot.bookings.push(b);
    if (SEAT_HOLDING_STATUSES.includes(b.status)) slot.used += b.party_size;
  }
  for (const slot of slots.values()) {
    slot.free = Math.max(0, slot.capacity - slot.used);
    // Active bookings first, then by name.
    slot.bookings.sort(
      (a, b) =>
        Number(!SEAT_HOLDING_STATUSES.includes(a.status)) - Number(!SEAT_HOLDING_STATUSES.includes(b.status)) ||
        a.name.localeCompare(b.name, "es"),
    );
  }
  return [...slots.values()].sort((a, b) => a.start.localeCompare(b.start));
}
