import { expect, test } from "@playwright/test";
import { db } from "./db";
import { fillBookingForm, pickFirstAvailableDateAndSlot, randomTestPhone } from "./helpers";

test("book 2 people: party → date → slot → form → success", async ({ page }) => {
  await page.goto("/");

  // Later steps are locked until the previous one is done.
  await expect(page.getByTestId("step-date")).toHaveAttribute("data-locked", "true");
  await expect(page.getByTestId("step-form")).toHaveAttribute("data-locked", "true");

  await page.getByRole("button", { name: "2 personas" }).click();
  await expect(page.getByTestId("step-date")).toHaveAttribute("data-locked", "false");

  await pickFirstAvailableDateAndSlot(page);
  await expect(page.getByTestId("step-form")).toHaveAttribute("data-locked", "false");

  // Validation errors in Spanish.
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByText("Escribe tu nombre.")).toBeVisible();

  const phone = randomTestPhone();
  await fillBookingForm(page, { phone });
  await page.getByRole("button", { name: "Reservar" }).click();

  const success = page.getByTestId("booking-success");
  await expect(success).toBeVisible();
  await expect(success.getByRole("heading", { name: "¡Listo!" })).toBeVisible();
  await expect(success).toContainText("Personas");
  await expect(success).toContainText("2");

  // Confirmation email is logged (and "sent" via the console transport in tests).
  const { data: booking } = await db.from("bookings").select("id").eq("phone", `+52${phone}`).single();
  await expect
    .poll(async () => {
      const { data } = await db.from("notifications_log").select("template, status").eq("booking_id", booking!.id);
      return data;
    })
    .toEqual([{ template: "booking_confirmation", status: "sent" }]);
});

test("9 o más renders a WhatsApp link", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "9 o más" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href === "#" || href?.startsWith("https://wa.me/")).toBe(true);
});
