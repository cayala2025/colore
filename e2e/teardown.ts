// Test bookings are never deleted: cancel them so their seats are free again.
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

export default async function globalTeardown() {
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const db = createClient(url, key, { auth: { persistSession: false } });
  await db
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("name", "ZZ Test")
    .eq("status", "confirmed");
  // Test pieces: mark picked up so they never get notifications.
  await db
    .from("pieces")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
    .eq("name", "ZZ Test")
    .in("status", ["received", "firing", "ready"]);
}
