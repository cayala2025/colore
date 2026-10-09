import { expect, test } from "@playwright/test";
import { insertBooking } from "./db";

test("block a day (warns about its bookings), then remove the block", async ({ page, context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
  // A far date unlikely to be blocked by hand, with one booking.
  const date = new Date(Date.now() + 57 * 86_400_000);
  while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() - 1);
  const iso = date.toISOString().slice(0, 10);
  await insertBooking(iso, "11:00");

  await page.goto("/admin/bloqueos");
  await page.getByLabel("Fecha").fill(iso);
  await page.getByLabel("Motivo (opcional)").fill("TEST");
  await page.getByRole("button", { name: "Bloquear día" }).click();
  await expect(page.getByTestId("block-warning")).toContainText("1 reservación");
  await expect(page.getByTestId(`block-${iso}`)).toContainText("TEST");

  // Blocked day is no longer bookable.
  const res = await page.request.get(`/api/availability?month=${iso.slice(0, 7)}&party=1`);
  expect((await res.json()).days.find((d: { date: string }) => d.date === iso)).toMatchObject({ bookable: false, slots: [] });

  await page.getByTestId(`block-${iso}`).getByRole("button", { name: "Quitar" }).click();
  await expect(page.getByTestId(`block-${iso}`)).toHaveCount(0);
});
