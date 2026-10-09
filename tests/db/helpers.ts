import { createClient } from "@supabase/supabase-js";
import { addDays, isoWeekday } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { MIN_DAYS_AHEAD, TEST_NAME, testEmail } from "../../test-support/liveDb";

export { TEST_NAME };

export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

/** The owner's email (TEST_EMAIL), lowercased like the database stores it. */
export const EMAIL = testEmail().toLowerCase();

/** Random test phone (+52 555 …), unique enough per run. */
export function testPhone(): string {
  return `+52555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
}

/** Thursday–Sunday, not blocked, between MIN_DAYS_AHEAD and 60 days ahead. */
async function testDates(): Promise<string[]> {
  const today = todayInStudio();
  const candidates: string[] = [];
  for (let i = MIN_DAYS_AHEAD; i <= 60; i++) {
    const d = addDays(today, i);
    if (isoWeekday(d) >= 4) candidates.push(d);
  }
  const { data } = await admin.from("blocked_dates").select("date").in("date", candidates);
  const blocked = new Set((data ?? []).map((b) => b.date as string));
  return candidates.filter((d) => !blocked.has(d));
}

/**
 * The n-th test date. Tests that fill a slot to capacity use their own index so they never collide:
 * 0 = concurrency 20:00, 1 = concurrency 11:00, 3 = slot_full 18:00. Others use 2, 4, 5.
 */
export async function testDate(n: number): Promise<string> {
  const dates = await testDates();
  return dates[n % dates.length];
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

export function book(args: { date: string; start: string; party: number; phone?: string }) {
  return admin.rpc("create_booking", {
    p_date: args.date,
    p_start_time: args.start,
    p_party_size: args.party,
    p_name: TEST_NAME,
    p_phone: args.phone ?? testPhone(),
    p_email: EMAIL,
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
