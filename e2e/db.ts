// Direct DB access for e2e setup (service role). The database is LIVE: every row created here is
// named "TEST" with the owner's email and is deleted in global teardown.
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { MIN_DAYS_AHEAD, TEST_NAME, testEmail } from "../test-support/liveDb";

loadEnvConfig(process.cwd());

const EMAIL = testEmail().toLowerCase();

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const phone = () => `+52555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;

/** Book TEST parties until at most `left` seats remain in the slot. */
export async function fillSlot(date: string, start: string, left: number) {
  for (;;) {
    const { data: slot } = await db
      .from("bookings")
      .select("party_size")
      .eq("date", date)
      .eq("start_time", start)
      .in("status", ["confirmed", "attended"]);
    const taken = (slot ?? []).reduce((s, r) => s + r.party_size, 0);
    const remaining = 30 - taken - left;
    if (remaining <= 0) return;
    const { error } = await db.rpc("create_booking", {
      p_date: date,
      p_start_time: start,
      p_party_size: Math.min(8, remaining),
      p_name: TEST_NAME,
      p_phone: phone(),
      p_email: EMAIL,
      p_whatsapp_opt_in: false,
    });
    if (error) throw new Error(error.message);
  }
}

/** Create a TEST booking through the RPC; returns its id and manage token. */
export async function createTestBooking(date: string, start = "11:00", party = 2) {
  const { data, error } = await db.rpc("create_booking", {
    p_date: date,
    p_start_time: start,
    p_party_size: party,
    p_name: TEST_NAME,
    p_phone: phone(),
    p_email: EMAIL,
    p_whatsapp_opt_in: false,
  });
  if (error) throw new Error(error.message);
  return data[0] as { id: string; manage_token: string };
}

const studioToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana" }).format(new Date());

/** First studio date tests may book (today + MIN_DAYS_AHEAD). */
export function minTestDate(): string {
  const d = new Date(`${studioToday()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + MIN_DAYS_AHEAD);
  return d.toISOString().slice(0, 10);
}

/** Thursday–Sunday dates between MIN_DAYS_AHEAD and 60 days ahead (bookable, far from real customers). */
export function testDates(): string[] {
  const dates: string[] = [];
  const d = new Date(`${minTestDate()}T12:00:00Z`);
  for (let i = MIN_DAYS_AHEAD; i <= 60; i++, d.setUTCDate(d.getUTCDate() + 1)) {
    if ([0, 4, 5, 6].includes(d.getUTCDay())) dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** The n-th test date (wraps around), so different tests usually use different days. */
export function futureDate(n: number): string {
  const dates = testDates();
  return dates[n % dates.length];
}

/** Insert a confirmed TEST booking on any date (bypasses the RPC window checks). */
export async function insertBooking(date: string, start = "18:00") {
  const { data, error } = await db
    .from("bookings")
    .insert({
      date,
      start_time: start,
      end_time: `${String(Number(start.slice(0, 2)) + 2).padStart(2, "0")}:00`,
      starts_at: new Date(`${date}T${start}:00-07:00`).toISOString(),
      party_size: 1,
      name: TEST_NAME,
      phone: phone(),
      email: EMAIL,
      privacy_accepted_at: new Date().toISOString(),
    })
    .select("id, manage_token")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; manage_token: string };
}

/** Insert a TEST piece checked in `daysAgo` days ago, with optional already-logged templates. */
export async function insertPiece(
  daysAgo: number,
  opts: { status?: string; delayed?: boolean; readyDaysAgo?: number; logged?: string[] } = {},
) {
  const at = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  const { data, error } = await db
    .from("pieces")
    .insert({
      name: TEST_NAME,
      phone: phone(),
      email: EMAIL,
      policy_accepted_at: at(daysAgo),
      checked_in_at: at(daysAgo),
      status: opts.status ?? "received",
      delayed: opts.delayed ?? false,
      ready_at: opts.readyDaysAgo === undefined ? null : at(opts.readyDaysAgo),
    })
    .select("id, code")
    .single();
  if (error) throw new Error(error.message);
  for (const template of opts.logged ?? []) {
    await db.from("notifications_log").insert({
      piece_id: data.id,
      template,
      recipient: EMAIL,
      status: "sent",
      // History happened on earlier days (the job sends at most one message per day).
      created_at: at(Math.max(1, daysAgo - 1)),
      sent_at: at(Math.max(1, daysAgo - 1)),
    });
  }
  return data as { id: string; code: string };
}

export async function pieceState(id: string) {
  const [{ data: piece }, { data: logs }] = await Promise.all([
    db.from("pieces").select("status, ready_at, donated_at").eq("id", id).single(),
    db.from("notifications_log").select("template").eq("piece_id", id).order("created_at"),
  ]);
  return { status: piece!.status as string, templates: (logs ?? []).map((l) => l.template as string) };
}
