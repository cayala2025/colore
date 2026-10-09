// Delete exactly the rows this run created (name "TEST" + TEST_EMAIL + created since the run started).
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { deleteTestRows, testEmail } from "../test-support/liveDb";

export default async function globalTeardown() {
  loadEnvConfig(process.cwd());
  const since = process.env.TEST_RUN_STARTED_AT;
  if (!since) return;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const removed = await deleteTestRows(db, testEmail().toLowerCase(), since);
  console.log(`[teardown] deleted this run's TEST rows (pieces: ${removed.pieces}, photos: ${removed.photos})`);
}
