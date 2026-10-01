import { afterAll, describe, expect, it } from "vitest";
import { addDays } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { book, cancelTestBookings, fillUntil, seatsLeft, testDate } from "./helpers";

afterAll(cancelTestBookings);

describe("create_booking RPC", () => {
  it("creates a booking and returns a manage token", async () => {
    const date = await testDate(40);
    const { data, error } = await book({ date, start: "16:00", party: 2 });
    expect(error).toBeNull();
    expect(data[0].manage_token).toMatch(/^[0-9a-f]{64}$/);
    expect(data[0].end_time).toBe("18:00:00");
  });

  it("rejects a party that does not fit (slot_full)", async () => {
    const date = await testDate(41);
    await fillUntil(date, "18:00", 7);
    const { error } = await book({ date, start: "18:00", party: 8 });
    expect(error?.message).toBe("slot_full");
    const ok = await book({ date, start: "18:00", party: 7 });
    expect(ok.error).toBeNull();
    expect(await seatsLeft(date, "18:00")).toBe(0);
  });

  it("rejects invalid party sizes", async () => {
    const date = await testDate(42);
    expect((await book({ date, start: "11:00", party: 0 })).error?.message).toBe("invalid_party");
    expect((await book({ date, start: "11:00", party: 9 })).error?.message).toBe("invalid_party");
  });

  it("rejects Mondays and unknown slots", async () => {
    let monday = addDays(todayInStudio(), 10);
    while (new Date(`${monday}T12:00:00Z`).getUTCDay() !== 1) monday = addDays(monday, 1);
    expect((await book({ date: monday, start: "11:00", party: 2 })).error?.message).toBe("slot_not_found");
    const date = await testDate(43);
    expect((await book({ date, start: "12:00", party: 2 })).error?.message).toBe("slot_not_found");
  });

  it("rejects dates outside the 60-day window", async () => {
    const today = todayInStudio();
    expect((await book({ date: addDays(today, -1), start: "11:00", party: 2 })).error?.message).toBe("out_of_window");
    expect((await book({ date: addDays(today, 61), start: "11:00", party: 2 })).error?.message).toBe("out_of_window");
  });

  it("cannot be called with the anon key", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await anon.rpc("create_booking", {
      p_date: await testDate(44),
      p_start_time: "11:00",
      p_party_size: 1,
      p_name: "x",
      p_phone: "+526860000000",
      p_email: "x@example.com",
      p_whatsapp_opt_in: false,
    });
    expect(error).not.toBeNull();
  });
});
