import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// Never send real email from tests: no key → console transport.
process.env.RESEND_API_KEY = "";

import { runBookingReminders } from "@/lib/jobs/bookingReminders";
import { runPieceTimeline } from "@/lib/jobs/pieceTimelineJob";
import { addDays } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { admin, cancelTestBookings, TEST_NAME, testPhone } from "./helpers";

let bookingId: string;
const pieceIds: string[] = [];

beforeAll(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const tomorrow = addDays(todayInStudio(), 1);
  const b = await admin
    .from("bookings")
    .insert({
      date: tomorrow,
      start_time: "18:00",
      end_time: "20:00",
      starts_at: new Date(Date.now() + 86_400_000).toISOString(),
      party_size: 1,
      name: TEST_NAME,
      phone: testPhone(),
      email: "zz-test@example.com",
      privacy_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  bookingId = b.data!.id;

  for (const [daysAgo, readyDaysAgo] of [
    [14, null],
    [21, 7],
  ] as const) {
    const p = await admin
      .from("pieces")
      .insert({
        name: TEST_NAME,
        phone: testPhone(),
        email: "zz-test@example.com",
        policy_accepted_at: new Date().toISOString(),
        checked_in_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
        ...(readyDaysAgo === null
          ? {}
          : { status: "ready", ready_at: new Date(Date.now() - readyDaysAgo * 86_400_000).toISOString() }),
      })
      .select("id")
      .single();
    pieceIds.push(p.data!.id);
  }
});

afterAll(async () => {
  await cancelTestBookings();
  await admin.from("pieces").update({ status: "picked_up" }).in("id", pieceIds);
});

describe("daily job is idempotent", () => {
  it("running it twice sends nothing twice", async () => {
    const first = { reminders: await runBookingReminders(), pieces: await runPieceTimeline() };
    const second = { reminders: await runBookingReminders(), pieces: await runPieceTimeline() };

    expect(first.reminders.sent).toBeGreaterThanOrEqual(1);
    expect(second.reminders.sent).toBe(0);
    expect(second.pieces.sent).toBe(0);
    expect(second.pieces.donated).toBe(0);

    const { data: bookingLogs } = await admin.from("notifications_log").select("template").eq("booking_id", bookingId);
    expect(bookingLogs).toEqual([{ template: "booking_reminder" }]);

    // Pieces are never moved to "ready" by the job: the day-14 piece only gets the "received" backup
    // (this test piece had none logged), never "lista".
    const { data: notReady } = await admin.from("notifications_log").select("template").eq("piece_id", pieceIds[0]);
    expect(notReady).toEqual([{ template: "piece_received" }]);
    const { data: p0 } = await admin.from("pieces").select("status").eq("id", pieceIds[0]).single();
    expect(p0?.status).toBe("received");
    // The piece marked ready 7 days ago gets "lista" (backup) today, one message per day.
    const { data: ready } = await admin.from("notifications_log").select("template").eq("piece_id", pieceIds[1]);
    expect(ready).toEqual([{ template: "piece_ready" }]);
  });

  it("the next day the day-21 piece gets its reminder, still once", async () => {
    const tomorrow = new Date(Date.now() + 86_400_000);
    const a = await runPieceTimeline(tomorrow);
    const b = await runPieceTimeline(tomorrow);
    expect(b.sent).toBe(0);
    expect(a.sent).toBeGreaterThanOrEqual(1);
    const { data } = await admin.from("notifications_log").select("template").eq("piece_id", pieceIds[1]).order("created_at");
    expect(data?.map((d) => d.template)).toEqual(["piece_ready", "piece_reminder_21"]);
  });
});
