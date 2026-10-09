// Guard + cleanup for tests that touch the database. There is ONE Supabase project and it is LIVE.
// Rules (CLAUDE.md): tests run only when deliberately unlocked, use the name "TEST" and the owner's
// email (TEST_EMAIL), book dates 50+ days ahead, and delete exactly the rows they created.
import type { SupabaseClient } from "@supabase/supabase-js";

export const TEST_NAME = "TEST";
export const MIN_DAYS_AHEAD = 50;
export const UNLOCK_VAR = "ALLOW_LIVE_DB_TESTS";

/**
 * Stop unless the run was unlocked ON THE COMMAND LINE (not from an .env file):
 *   ALLOW_LIVE_DB_TESTS=yes npm run test:e2e
 */
export function assertLiveDbTestsUnlocked(commandLineEnv: NodeJS.ProcessEnv, fileEnv: Record<string, string | undefined>) {
  const problems: string[] = [];
  if (commandLineEnv[UNLOCK_VAR] !== "yes") {
    problems.push(`these tests write to the LIVE database. To run them on purpose: ${UNLOCK_VAR}=yes npm run <script>`);
  }
  if (!fileEnv.TEST_EMAIL) problems.push("TEST_EMAIL (your own email) must be set in .env.local");
  if (problems.length) {
    console.error(`\n🔒 Locked: ${problems.join("\n🔒 Locked: ")}\n`);
    process.exit(1);
  }
}

export function testEmail(): string {
  const email = process.env.TEST_EMAIL;
  if (!email) throw new Error("TEST_EMAIL is not set");
  return email;
}

/**
 * Delete exactly the rows this test run created: name "TEST", the owner's email, created since the
 * run started. Piece photos are removed from Storage; notification rows go with their booking/piece.
 */
export async function deleteTestRows(db: SupabaseClient, email: string, since: string) {
  const { data: pieces } = await db
    .from("pieces")
    .select("id, photo_path")
    .eq("name", TEST_NAME)
    .eq("email", email)
    .gte("created_at", since);
  const photos = (pieces ?? []).map((p) => p.photo_path as string | null).filter((p): p is string => Boolean(p));
  if (photos.length) await db.storage.from("pieces").remove(photos);
  if (pieces?.length) await db.from("pieces").delete().in("id", pieces.map((p) => p.id));

  await db.from("bookings").delete().eq("name", TEST_NAME).eq("email", email).gte("created_at", since);
  await db.from("blocked_dates").delete().eq("reason", TEST_NAME).gte("created_at", since);
  return { pieces: pieces?.length ?? 0, photos: photos.length };
}
