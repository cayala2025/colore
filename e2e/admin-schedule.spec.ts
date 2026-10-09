import { expect, test } from "@playwright/test";
import { insertBooking, testDates } from "./db";

// Never saves changes to the real schedule (the database is live): only checks that bad edits are refused.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
});

test("validation and protection of upcoming bookings (nothing is saved)", async ({ page }) => {
  const sunday = testDates().find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 0)!;
  await insertBooking(sunday, "20:00");

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
