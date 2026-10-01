import "server-only";
import type { ScheduleSlotRow } from "../availability";
import { addDays, isoWeekday } from "../calendar";
import { supabaseAdmin } from "../supabase/admin";
import { groupBookingsBySlot, type AdminBooking, type AdminSlot } from "./daySlots";
import { buildWeek, type AdminWeekDay } from "./week";

export const ADMIN_BOOKING_COLUMNS =
  "id, name, phone, email, party_size, status, start_time, end_time, customer_confirmed_at, manage_token, date";

export type AdminDay = {
  date: string;
  blocked: { reason: string | null } | null;
  slots: AdminSlot[];
};

export async function getAdminDay(date: string): Promise<AdminDay> {
  const db = supabaseAdmin();
  const [schedule, blocked, bookings] = await Promise.all([
    db.from("schedule_slots").select("weekday, start_time, end_time, capacity, active").eq("weekday", isoWeekday(date)),
    db.from("blocked_dates").select("reason").eq("date", date).maybeSingle(),
    db.from("bookings").select(ADMIN_BOOKING_COLUMNS).eq("date", date),
  ]);
  const error = schedule.error ?? blocked.error ?? bookings.error;
  if (error) throw new Error(`admin day query failed: ${error.message}`);
  return {
    date,
    blocked: blocked.data ? { reason: (blocked.data as { reason: string | null }).reason } : null,
    slots: groupBookingsBySlot(schedule.data as ScheduleSlotRow[], bookings.data as AdminBooking[]),
  };
}

export async function getAdminWeek(monday: string): Promise<AdminWeekDay[]> {
  const db = supabaseAdmin();
  const sunday = addDays(monday, 6);
  const [schedule, blocked, bookings] = await Promise.all([
    db.from("schedule_slots").select("weekday, start_time, end_time, capacity, active"),
    db.from("blocked_dates").select("date").gte("date", monday).lte("date", sunday),
    db
      .from("bookings")
      .select(ADMIN_BOOKING_COLUMNS)
      .gte("date", monday)
      .lte("date", sunday)
      .in("status", ["confirmed", "attended", "no_show"]),
  ]);
  const error = schedule.error ?? blocked.error ?? bookings.error;
  if (error) throw new Error(`admin week query failed: ${error.message}`);
  return buildWeek(
    monday,
    schedule.data as ScheduleSlotRow[],
    (blocked.data ?? []).map((b) => b.date as string),
    bookings.data as AdminBooking[],
  );
}
