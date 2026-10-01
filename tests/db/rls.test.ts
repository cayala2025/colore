import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

const TABLES = ["schedule_slots", "blocked_dates", "bookings", "admins", "pieces"];

describe("public API (anon key) cannot touch tables", () => {
  for (const table of TABLES) {
    it(`${table}: select returns no rows`, async () => {
      const { data, error } = await anon.from(table).select("*").limit(1);
      // Either RLS hides everything or the role has no privilege at all.
      if (error) expect(error.code).toBeTruthy();
      else expect(data).toEqual([]);
    });

    it(`${table}: insert is rejected`, async () => {
      const { error } = await anon.from(table).insert({});
      expect(error).not.toBeNull();
    });
  }
});
