import { expect, test } from "@playwright/test";
import { insertBooking, testDates } from "./db";

test("week view shows bookings per slot and links to the day", async ({ page, context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
  const iso = testDates().find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 5)!; // a Friday, 50+ days ahead
  await insertBooking(iso, "18:00");

  await page.goto(`/admin/calendario?semana=${iso}`);
  const day = page.getByTestId(`day-${iso}`);
  await expect(day).toContainText("viernes");
  await expect(day).toContainText("18:00 – 20:00");
  await expect(day).toContainText("TEST · 1");
  await day.getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`/admin\\?fecha=${iso}$`));
});
