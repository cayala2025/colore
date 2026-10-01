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
