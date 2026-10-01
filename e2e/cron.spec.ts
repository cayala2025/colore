import { expect, test } from "@playwright/test";
import { db, insertBooking } from "./db";

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
