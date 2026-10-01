import { expect, test } from "@playwright/test";
import { insertBooking } from "./db";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
});

test("Hoy shows the day's slots, seats and bookings", async ({ page }) => {
  const date = new Date(Date.now() + 9 * 86_400_000);
  while (![0, 4, 5, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  const iso = date.toISOString().slice(0, 10);
  const { id } = await insertBooking(iso, "16:00");

  await page.goto(`/admin?fecha=${iso}`);
  const slot = page.getByTestId("slot-16:00");
  await expect(slot).toContainText("16:00 – 18:00");
  await expect(slot).toContainText(/de 30 lugares/);
  await expect(page.getByTestId(`booking-${id}`)).toContainText("ZZ Test");
  await expect(page.getByTestId(`booking-${id}`)).toContainText("Reservada");
  await expect(page.getByTestId("slot-20:00")).toBeVisible(); // Thu–Sun have 4 slots
});
