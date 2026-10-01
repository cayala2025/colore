import { expect, test } from "@playwright/test";
import { insertBooking } from "./db";

test("week view shows bookings per slot and links to the day", async ({ page, context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
  const date = new Date(Date.now() + 15 * 86_400_000);
  while (date.getUTCDay() !== 5) date.setUTCDate(date.getUTCDate() + 1); // a Friday
  const iso = date.toISOString().slice(0, 10);
  await insertBooking(iso, "18:00");

  await page.goto(`/admin/calendario?semana=${iso}`);
  const day = page.getByTestId(`day-${iso}`);
  await expect(day).toContainText("viernes");
  await expect(day).toContainText("18:00 – 20:00");
  await expect(day).toContainText("ZZ Test · 1");
  await day.getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`/admin\\?fecha=${iso}$`));
});
