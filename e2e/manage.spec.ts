import { expect, test } from "@playwright/test";
import { createTestBooking, db, futureDate } from "./db";

test("manage link: shows the booking and confirms attendance", async ({ page }) => {
  const { id, manage_token } = await createTestBooking(futureDate(20));
  await page.goto(`/r/${manage_token}?accion=confirmar`);
  await expect(page.getByTestId("manage-booking")).toContainText("Hola, ZZ");
  await expect(page.getByTestId("manage-status")).toHaveText("Reservada");

  await page.getByRole("button", { name: "Confirmar que voy" }).click();
  await expect(page.getByTestId("manage-status")).toHaveText("Confirmaste que vienes");
  const { data } = await db.from("bookings").select("customer_confirmed_at, status").eq("id", id).single();
  expect(data?.customer_confirmed_at).not.toBeNull();
  expect(data?.status).toBe("confirmed");
});

test("manage link: unknown token shows a friendly message", async ({ page }) => {
  await page.goto(`/r/${"0".repeat(64)}`);
  await expect(page.getByText("No encontramos esta reservación")).toBeVisible();
});

test("opening the link (GET) never changes the booking", async ({ page }) => {
  const { id, manage_token } = await createTestBooking(futureDate(21));
  await page.goto(`/r/${manage_token}?accion=cancelar`);
  await page.goto(`/r/${manage_token}?accion=confirmar`);
  const { data } = await db.from("bookings").select("customer_confirmed_at, status").eq("id", id).single();
  expect(data).toEqual({ customer_confirmed_at: null, status: "confirmed" });
});
