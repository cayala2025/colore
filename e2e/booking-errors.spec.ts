import { expect, test } from "@playwright/test";
import { fillSlot } from "./db";
import { fillBookingForm, pickFirstAvailableDateAndSlot, randomTestPhone } from "./helpers";

test("same phone twice → friendly 'already has a booking' error", async ({ page }) => {
  const phone = randomTestPhone();
  await page.goto("/");
  await page.getByRole("button", { name: "2 personas" }).click();
  await pickFirstAvailableDateAndSlot(page);
  await fillBookingForm(page, { phone });
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByTestId("booking-success")).toBeVisible();

  await page.getByRole("button", { name: "Hacer otra reservación" }).click();
  await page.getByRole("button", { name: "1 persona" }).click();
  await pickFirstAvailableDateAndSlot(page);
  await fillBookingForm(page, { phone });
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByTestId("form-error")).toContainText("ya tiene una reservación");
});

test("slot fills up before submit → friendly error and fresh slots", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "4 personas" }).click();
  const { date, start } = await pickFirstAvailableDateAndSlot(page);
  await fillBookingForm(page);

  // Someone else takes the seats meanwhile: only 3 left for our party of 4.
  await fillSlot(date, start, 3);
  await page.getByRole("button", { name: "Reservar" }).click();

  await expect(page.getByTestId("slot-notice")).toContainText("se acaba de llenar");
  await expect(page.getByTestId("step-form")).toHaveAttribute("data-locked", "true");
  await expect(page.locator(`[data-slot="${start}"]`)).toBeDisabled();
  await expect(page.locator(`[data-slot="${start}"]`)).toContainText("No disponible");
});
