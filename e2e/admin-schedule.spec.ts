import { expect, test } from "@playwright/test";
import { db, insertBooking } from "./db";

// Edits a real slot of the dev schedule (Sunday 20:00) and always restores it.
test.afterEach(async () => {
  await db.from("schedule_slots").update({ capacity: 30, active: true, start_time: "20:00", end_time: "22:00" }).eq("weekday", 7).eq("start_time", "20:00");
});

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
});

test("edit capacity and turn a slot off/on", async ({ page }) => {
  await page.goto("/admin/horario");
  const row = page.getByTestId("slot-row-7-20:00");
  await row.getByLabel("Lugares").fill("25");
  await row.getByLabel("Abierto").uncheck();
  await row.getByRole("button", { name: "Guardar" }).click();
  await expect(row).toContainText("Guardado");

  const { data } = await db.from("schedule_slots").select("capacity, active").eq("weekday", 7).eq("start_time", "20:00").single();
  expect(data).toEqual({ capacity: 25, active: false });
});

test("validation and protection of upcoming bookings", async ({ page }) => {
  const sunday = new Date(Date.now() + 8 * 86_400_000);
  while (sunday.getUTCDay() !== 0) sunday.setUTCDate(sunday.getUTCDate() + 1);
  await insertBooking(sunday.toISOString().slice(0, 10), "20:00");

  await page.goto("/admin/horario");
  const row = page.getByTestId("slot-row-7-20:00");
  await row.getByLabel("Fin").fill("19:00");
  await row.getByRole("button", { name: "Guardar" }).click();
  await expect(row.getByRole("alert")).toContainText("Revisa las horas");

  await row.getByLabel("Inicio").fill("20:30");
  await row.getByLabel("Fin").fill("22:30");
  await row.getByRole("button", { name: "Guardar" }).click();
  await expect(row.getByRole("alert")).toContainText("Hay reservaciones futuras");
});
