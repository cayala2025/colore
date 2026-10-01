import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { todayInStudio } from "./time";

export type TodaysBooking = { id: string; name: string; email: string };

/**
 * The customer's booking for today (studio date), if any. Used only on the server to link a piece
 * to its booking; never returned to the browser (no prefill, so phones can't be used to look up people).
 */
export async function findTodaysBooking(phone: string, now = new Date()): Promise<TodaysBooking | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("id, name, email")
    .eq("phone", phone)
    .eq("date", todayInStudio(now))
    .in("status", ["confirmed", "attended"])
    .order("start_time")
    .limit(1);
  if (error) throw new Error(`todays booking lookup failed: ${error.message}`);
  return (data?.[0] as TodaysBooking | undefined) ?? null;
}
