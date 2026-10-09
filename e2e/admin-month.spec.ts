import { expect, test } from "@playwright/test";
import { db, insertBooking, testDates } from "./db";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
});

/** A Friday 50+ days ahead (open day with 4 slots). */
function testFriday() {
  return testDates().find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 5)!;
}

test("week is the default; switch to Mes and back", async ({ page }) => {
  await page.goto("/admin/calendario");
  await expect(page.getByRole("link", { name: "Semana", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Semana del");

  await page.getByRole("link", { name: "Mes", exact: true }).click();
  await expect(page).toHaveURL(/vista=mes/);
  await expect(page.getByRole("link", { name: "Mes", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("month-summary")).toBeVisible();

  await page.getByRole("link", { name: "Semana", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Semana del");
});

test("month cell shows people vs capacity, color, summary; tapping opens the day", async ({ page }) => {
  const date = testFriday();
  const month = date.slice(0, 7);
  const { id } = await insertBooking(date, "16:00");
  await db.from("bookings").update({ party_size: 6 }).eq("id", id);

  // Expected people booked that day (other test rows may exist too).
  const { data } = await db.from("bookings").select("party_size").eq("date", date).in("status", ["confirmed", "attended"]);
  const used = (data ?? []).reduce((s, r) => s + r.party_size, 0);

  await page.goto(`/admin/calendario?vista=mes&mes=${month}`);
  const cell = page.getByTestId(`month-day-${date}`);
  await expect(cell).toContainText(`${used}/120`);
  await expect(cell).not.toHaveAttribute("data-level", "empty");
  await expect(page.getByTestId("month-summary")).toContainText(/reservaci(ón|ones)/);
  await expect(page.getByTestId("month-summary")).toContainText("Día más lleno");

  // Mondays are closed.
  const monday = new Date(`${date}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - 4);
  await expect(page.getByTestId(`month-day-${monday.toISOString().slice(0, 10)}`)).toHaveAttribute("aria-label", /Cerrado/);

  await cell.click();
  await expect(page).toHaveURL(new RegExp(`/admin\\?fecha=${date}$`));
});

test("month navigation goes back to past months and returns to this month", async ({ page }) => {
  await page.goto("/admin/calendario?vista=mes");
  const title = await page.getByRole("heading", { level: 1 }).textContent();
  await page.getByRole("link", { name: "Mes anterior" }).click();
  await page.getByRole("link", { name: "Mes anterior" }).click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(title!);
  await expect(page.getByTestId("month-summary")).toBeVisible();
  await page.getByRole("link", { name: "Este mes" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
});
