import { createClient } from "@supabase/supabase-js";
import { addDays, isoWeekday } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";

export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

export const TEST_NAME = "ZZ Test";

/** Random test phone (+52 555 …), unique enough per run. */
export function testPhone(): string {
  return `+52555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
}

/** A future Thursday–Sunday date that is not blocked, `offset` days-ish ahead. */
export async function testDate(offset = 50): Promise<string> {
  let date = addDays(todayInStudio(), offset);
  while (isoWeekday(date) < 4) date = addDays(date, 1);
  const { data } = await admin.from("blocked_dates").select("date").eq("date", date);
  if (data?.length) return testDate(offset + 7);
  return date;
}

export async function seatsLeft(date: string, start: string): Promise<number> {
  const { data: slot } = await admin
    .from("schedule_slots")
    .select("capacity")
    .eq("weekday", isoWeekday(date))
    .eq("start_time", start)
    .single();
  const { data: rows } = await admin
    .from("bookings")
    .select("party_size")
    .eq("date", date)
    .eq("start_time", start)
    .in("status", ["confirmed", "attended"]);
  return slot!.capacity - (rows ?? []).reduce((s, r) => s + r.party_size, 0);
}

export function book(args: { date: string; start: string; party: number; phone?: string; email?: string }) {
  return admin.rpc("create_booking", {
    p_date: args.date,
    p_start_time: args.start,
    p_party_size: args.party,
    p_name: TEST_NAME,
    p_phone: args.phone ?? testPhone(),
    p_email: args.email ?? "zz-test@example.com",
    p_whatsapp_opt_in: false,
  });
}

/** Fill a slot until exactly `left` seats remain. */
export async function fillUntil(date: string, start: string, left: number) {
  let remaining = (await seatsLeft(date, start)) - left;
  while (remaining > 0) {
    const party = Math.min(8, remaining);
    const { error } = await book({ date, start, party });
    if (error) throw new Error(`fill failed: ${error.message}`);
    remaining -= party;
  }
}

/** Test rows are never deleted: cancel them so their seats are free again. */
export async function cancelTestBookings() {
  await admin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("name", TEST_NAME)
    .eq("status", "confirmed");
}
