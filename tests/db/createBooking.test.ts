import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { admin, book, fillUntil, seatsLeft, testDate, testPhone } from "./helpers";

describe("create_booking RPC", () => {
  it("creates a booking and returns a manage token", async () => {
    const date = await testDate(2);
    const { data, error } = await book({ date, start: "16:00", party: 2 });
    expect(error).toBeNull();
    expect(data[0].manage_token).toMatch(/^[0-9a-f]{64}$/);
    expect(data[0].end_time).toBe("18:00:00");
  });

  it("rejects a party that does not fit (slot_full)", async () => {
    const date = await testDate(3);
    await fillUntil(date, "18:00", 7);
    const { error } = await book({ date, start: "18:00", party: 8 });
    expect(error?.message).toBe("slot_full");
    const ok = await book({ date, start: "18:00", party: 7 });
    expect(ok.error).toBeNull();
    expect(await seatsLeft(date, "18:00")).toBe(0);
  });

  it("rejects invalid party sizes", async () => {
    const date = await testDate(2);
    expect((await book({ date, start: "11:00", party: 0 })).error?.message).toBe("invalid_party");
    expect((await book({ date, start: "11:00", party: 9 })).error?.message).toBe("invalid_party");
  });

  it("rejects Mondays and unknown slots", async () => {
    let monday = addDays(todayInStudio(), 10);
    while (new Date(`${monday}T12:00:00Z`).getUTCDay() !== 1) monday = addDays(monday, 1);
    expect((await book({ date: monday, start: "11:00", party: 2 })).error?.message).toBe("slot_not_found");
    const date = await testDate(2);
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
      p_date: await testDate(2),
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

describe("one upcoming booking per phone", () => {
  it("rejects a second upcoming booking for the same phone", async () => {
    const phone = testPhone();
    const first = await book({ date: await testDate(2), start: "11:00", party: 2, phone });
    expect(first.error).toBeNull();
    const second = await book({ date: await testDate(4), start: "16:00", party: 2, phone });
    expect(second.error?.message).toBe("phone_has_booking");
  });

  it("allows booking again once the previous one is cancelled", async () => {
    const phone = testPhone();
    const first = await book({ date: await testDate(4), start: "11:00", party: 2, phone });
    await admin.from("bookings").update({ status: "cancelled" }).eq("id", first.data[0].id);
    const again = await book({ date: await testDate(5), start: "11:00", party: 2, phone });
    expect(again.error).toBeNull();
  });

  it("rejects phones that are not E.164 (+52/+1)", async () => {
    const { error } = await book({ date: await testDate(2), start: "11:00", party: 2, phone: "6861234567" });
    expect(error?.message).toBe("invalid_phone");
  });
});
