import { expect, test } from "@playwright/test";
import { db, insertBooking } from "./db";

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

test("Llegó / No vino / Cancelar update the booking", async ({ page }) => {
  const date = new Date(Date.now() + 10 * 86_400_000);
  while (![0, 4, 5, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  const iso = date.toISOString().slice(0, 10);
  const a = await insertBooking(iso, "11:00");
  const b = await insertBooking(iso, "11:00");
  const c = await insertBooking(iso, "11:00");
  await page.goto(`/admin?fecha=${iso}`);

  const rowA = page.getByTestId(`booking-${a.id}`);
  await rowA.getByRole("button", { name: "Llegó" }).click();
  await expect(rowA).toContainText("Llegó");
  await expect(rowA.getByRole("button", { name: "Deshacer" })).toBeVisible();

  const rowB = page.getByTestId(`booking-${b.id}`);
  await rowB.getByRole("button", { name: "No vino" }).click();
  await expect(rowB.locator("span", { hasText: "No vino" })).toBeVisible();

  const rowC = page.getByTestId(`booking-${c.id}`);
  await rowC.getByRole("button", { name: "Cancelar" }).click();
  await rowC.getByRole("button", { name: "Sí" }).click();
  await expect(rowC).toContainText("Cancelada");
  await expect(rowC.getByRole("button")).toHaveCount(0);

  const { data } = await db.from("bookings").select("id, status").in("id", [a.id, b.id, c.id]);
  const byId = Object.fromEntries((data ?? []).map((r) => [r.id, r.status]));
  expect(byId).toEqual({ [a.id]: "attended", [b.id]: "no_show", [c.id]: "cancelled" });
});
