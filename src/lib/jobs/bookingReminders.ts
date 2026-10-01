import "server-only";
import { addDays } from "../calendar";
import { sendBookingReminder, type BookingForEmail } from "../messages";
import type { NotifyOutcome } from "../notify";
import { supabaseAdmin } from "../supabase/admin";
import { todayInStudio } from "../time";

export type JobCounts = Record<NotifyOutcome, number>;

export const emptyCounts = (): JobCounts => ({ sent: 0, skipped: 0, failed: 0 });

/** Remind every confirmed booking for tomorrow (studio date). Idempotent through notify(). */
export async function runBookingReminders(now = new Date()): Promise<JobCounts & { date: string }> {
  const date = addDays(todayInStudio(now), 1);
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("id, name, email, date, start_time, end_time, party_size, manage_token")
    .eq("date", date)
    .eq("status", "confirmed");
  if (error) throw new Error(`reminder query failed: ${error.message}`);

  const counts = emptyCounts();
  for (const booking of (data ?? []) as BookingForEmail[]) {
    counts[await sendBookingReminder(booking)] += 1;
  }
  return { date, ...counts };
}
