import { expect, test } from "@playwright/test";

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
