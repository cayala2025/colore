import { expect, test } from "@playwright/test";
import { db, insertBooking, insertPiece, pieceState } from "./db";

const SECRET = "e2e-cron-secret";

test("daily cron rejects requests without the secret", async ({ request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect((await request.get("/api/cron/daily", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
});

test("daily cron runs with the secret", async ({ request }) => {
  const res = await request.get("/api/cron/daily", { headers: { Authorization: `Bearer ${SECRET}` } });
  expect(res.status()).toBe(200);
  expect((await res.json()).ok).toBe(true);
});

test("reminds tomorrow's bookings once, even if the job runs twice", async ({ request }) => {
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana" }).format(
    new Date(Date.now() + 86_400_000),
  );
  const { id } = await insertBooking(tomorrow);

  const run = () => request.get("/api/cron/daily", { headers: { Authorization: `Bearer ${SECRET}` } });
  const first = await (await run()).json();
  expect(first.bookingReminders.date).toBe(tomorrow);
  await run();

  const { data } = await db.from("notifications_log").select("template, status").eq("booking_id", id);
  expect(data).toEqual([{ template: "booking_reminder", status: "sent" }]);
});

test("piece timeline: never auto-ready; reminders / final notice / donation count from 'lista'; idempotent", async ({ request }) => {
  const all = ["piece_received", "piece_ready", "piece_reminder_21", "piece_reminder_30", "piece_final_notice"];
  const day14 = await insertPiece(14, { logged: ["piece_received"] });
  const day30Firing = await insertPiece(30, { status: "firing", logged: ["piece_received"] });
  const ready7 = await insertPiece(21, { status: "ready", readyDaysAgo: 7, logged: all.slice(0, 2) });
  const ready16 = await insertPiece(30, { status: "ready", readyDaysAgo: 16, logged: all.slice(0, 3) });
  const ready26 = await insertPiece(40, { status: "ready", readyDaysAgo: 26, logged: all.slice(0, 4) });
  const ready31 = await insertPiece(45, { status: "ready", readyDaysAgo: 31, logged: all });
  const lateReady = await insertPiece(45, { status: "ready", readyDaysAgo: 10, logged: all.slice(0, 3) });
  const pickedUp = await insertPiece(45, { status: "picked_up", logged: ["piece_received"] });

  const run = () => request.get("/api/cron/daily", { headers: { Authorization: `Bearer ${SECRET}` } });
  expect((await run()).status()).toBe(200);
  expect((await run()).status()).toBe(200); // second run must change nothing

  // Not marked ready by staff → stays as is, no "lista" message.
  expect(await pieceState(day14.id)).toEqual({ status: "received", templates: ["piece_received"] });
  expect(await pieceState(day30Firing.id)).toEqual({ status: "firing", templates: ["piece_received"] });
  expect((await pieceState(ready7.id)).templates).toEqual(all.slice(0, 2).concat("piece_reminder_21"));
  expect((await pieceState(ready16.id)).templates).toEqual(all.slice(0, 3).concat("piece_reminder_30"));
  expect((await pieceState(ready26.id)).templates).toEqual(all);
  expect(await pieceState(ready31.id)).toEqual({ status: "donated", templates: all });
  // Ready only 10 days ago (day 45 since check-in): still in its 31 days, nothing new.
  expect(await pieceState(lateReady.id)).toEqual({ status: "ready", templates: all.slice(0, 3) });
  expect(await pieceState(pickedUp.id)).toEqual({ status: "picked_up", templates: ["piece_received"] });
});
