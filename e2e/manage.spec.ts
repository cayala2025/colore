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

test("cancel from the email link frees the seats", async ({ page }) => {
  const date = futureDate(22);
  const { id, manage_token } = await createTestBooking(date, "16:00", 8);
  const seatsTaken = async () => {
    const { data } = await db.from("bookings").select("party_size").eq("date", date).eq("start_time", "16:00").in("status", ["confirmed", "attended"]);
    return (data ?? []).reduce((s, r) => s + r.party_size, 0);
  };
  const before = await seatsTaken();

  await page.goto(`/r/${manage_token}?accion=cancelar`);
  await expect(page.getByTestId("cancel-ask")).toBeVisible();
  await page.getByRole("button", { name: "Sí, cancelar" }).click();
  await expect(page.getByTestId("manage-status")).toHaveText("Cancelada");
  await expect(page.getByRole("link", { name: "Hacer una nueva reservación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancelar reservación" })).toHaveCount(0);

  const { data } = await db.from("bookings").select("status, cancelled_at").eq("id", id).single();
  expect(data?.status).toBe("cancelled");
  expect(await seatsTaken()).toBe(before - 8);

  // The availability API sees the freed seats too.
  const res = await page.request.get(`/api/availability?month=${date.slice(0, 7)}&party=1`);
  const day = (await res.json()).days.find((d: { date: string }) => d.date === date);
  const slot = day.slots.find((s: { start: string }) => s.start === "16:00");
  expect(slot.seatsLeft).toBe(30 - (before - 8));
});
