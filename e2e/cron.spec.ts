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

test("piece timeline: ready / 21 / 30 / 40 / donate at 45, idempotent", async ({ request }) => {
  const all = ["piece_received", "piece_ready", "piece_reminder_21", "piece_reminder_30", "piece_final_notice"];
  const day14 = await insertPiece(14, { logged: ["piece_received"] });
  const day14Delayed = await insertPiece(14, { delayed: true, logged: ["piece_received"] });
  const day21 = await insertPiece(21, { status: "ready", readyDaysAgo: 7, logged: all.slice(0, 2) });
  const day30 = await insertPiece(30, { status: "ready", readyDaysAgo: 16, logged: all.slice(0, 3) });
  const day40 = await insertPiece(40, { status: "ready", readyDaysAgo: 26, logged: all.slice(0, 4) });
  const day45 = await insertPiece(45, { status: "ready", readyDaysAgo: 31, logged: all });
  const pickedUp = await insertPiece(45, { status: "picked_up", logged: ["piece_received"] });

  const run = () => request.get("/api/cron/daily", { headers: { Authorization: `Bearer ${SECRET}` } });
  expect((await run()).status()).toBe(200);
  expect((await run()).status()).toBe(200); // second run must change nothing

  expect(await pieceState(day14.id)).toEqual({ status: "ready", templates: ["piece_received", "piece_ready"] });
  expect(await pieceState(day14Delayed.id)).toEqual({ status: "received", templates: ["piece_received"] });
  expect((await pieceState(day21.id)).templates).toEqual(all.slice(0, 2).concat("piece_reminder_21"));
  expect((await pieceState(day30.id)).templates).toEqual(all.slice(0, 3).concat("piece_reminder_30"));
  expect((await pieceState(day40.id)).templates).toEqual(all);
  expect(await pieceState(day45.id)).toEqual({ status: "donated", templates: all });
  expect(await pieceState(pickedUp.id)).toEqual({ status: "picked_up", templates: ["piece_received"] });
});
