// Direct DB access for e2e setup (service role, dev project only).
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const phone = () => `+52555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;

/** Book "ZZ Test" parties until at most `left` seats remain in the slot. */
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
      p_name: "ZZ Test",
      p_phone: phone(),
      p_email: "zz-test@example.com",
      p_whatsapp_opt_in: false,
    });
    if (error) throw new Error(error.message);
  }
}

/** Insert a "ZZ Test" booking for today (studio date) directly, for prefill tests. */
export async function insertTodaysBooking(phoneE164: string, email: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana" }).format(new Date());
  const { data, error } = await db
    .from("bookings")
    .insert({
      date: today,
      start_time: "11:00",
      end_time: "13:00",
      starts_at: new Date(Date.now() - 3600_000).toISOString(),
      party_size: 2,
      name: "ZZ Test",
      phone: phoneE164,
      email,
      privacy_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Create a "ZZ Test" booking through the RPC; returns its id and manage token. */
export async function createTestBooking(date: string, start = "11:00", party = 2) {
  const { data, error } = await db.rpc("create_booking", {
    p_date: date,
    p_start_time: start,
    p_party_size: party,
    p_name: "ZZ Test",
    p_phone: phone(),
    p_email: "zz-test@example.com",
    p_whatsapp_opt_in: false,
  });
  if (error) throw new Error(error.message);
  return data[0] as { id: string; manage_token: string };
}

/** A Thursday–Sunday studio date roughly `offset` days ahead. */
export function futureDate(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  while (![0, 4, 5, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
