import "server-only";
import { computeAvailability, SEAT_HOLDING_STATUSES, type BookingRow, type ScheduleSlotRow } from "./availability";
import { daysInMonth } from "./calendar";
import { supabaseAdmin } from "./supabase/admin";
import type { DayAvailability } from "./types";

/** Load schedule, blocks and bookings for a month and compute availability. */
export async function getMonthAvailability(month: string, party: number, now = new Date()): Promise<DayAvailability[]> {
  const from = `${month}-01`;
  const to = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const db = supabaseAdmin();

  const [schedule, blocked, bookings] = await Promise.all([
    db.from("schedule_slots").select("weekday, start_time, end_time, capacity, active").eq("active", true),
    db.from("blocked_dates").select("date").gte("date", from).lte("date", to),
    db
      .from("bookings")
      .select("date, start_time, party_size, status")
      .gte("date", from)
      .lte("date", to)
      .in("status", SEAT_HOLDING_STATUSES),
  ]);
  const error = schedule.error ?? blocked.error ?? bookings.error;
  if (error) throw new Error(`availability query failed: ${error.message}`);

  return computeAvailability({
    schedule: schedule.data as ScheduleSlotRow[],
    blockedDates: (blocked.data ?? []).map((b) => b.date as string),
    bookings: bookings.data as BookingRow[],
    party,
    from,
    to,
    now,
  });
}
