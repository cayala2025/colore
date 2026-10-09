import { expect, test } from "@playwright/test";

// The daily job itself is never run from tests: it would process REAL customers' bookings and pieces
// (the database is live). Its logic is covered by unit tests (pieceTimeline, notify) instead.
test("daily cron rejects requests without the right secret", async ({ request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect((await request.get("/api/cron/daily", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
});
