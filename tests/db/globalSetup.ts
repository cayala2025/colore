// Delete exactly the rows this run created (name "TEST" + TEST_EMAIL + created since the run started).
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { deleteTestRows } from "../../test-support/liveDb";

export default function setup() {
  const since = new Date().toISOString();
  return async function teardown() {
    const env = loadEnv("development", process.cwd(), "");
    const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const removed = await deleteTestRows(db, env.TEST_EMAIL.toLowerCase(), since);
    console.log(`[teardown] deleted this run's TEST rows (pieces: ${removed.pieces}, photos: ${removed.photos})`);
  };
}
