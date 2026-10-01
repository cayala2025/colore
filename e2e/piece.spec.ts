import { expect, test } from "@playwright/test";
import path from "node:path";
import { db, insertTodaysBooking } from "./db";
import { fillPieceForm, randomTestPhone } from "./helpers";

const MUG = path.join(__dirname, "fixtures", "mug.jpg");

test("photo step: take photo → preview → Otra foto / Usar esta", async ({ page }) => {
  await page.goto("/pieza");
  await expect(page.getByText("Tomar foto")).toBeVisible();

  await page.getByTestId("photo-input").setInputFiles(MUG);
  const preview = page.getByTestId("photo-preview");
  await expect(preview).toBeVisible();

  // Compressed to ≤ 1600px long edge.
  const size = await preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(Math.max(...size)).toBeLessThanOrEqual(1600);
  expect(size).toEqual([1600, 1067]);

  await expect(page.getByText("Otra foto")).toBeVisible();
  await page.getByRole("button", { name: "Usar esta" }).click();
  await expect(page.getByRole("button", { name: "Usar esta" })).toHaveCount(0);
});

test("phone with a booking today prefills name and email", async ({ page }) => {
  const local = randomTestPhone();
  const bookingId = await insertTodaysBooking(`+52${local}`, "zz-prefill@example.com");

  await page.goto("/pieza");
  await page.getByTestId("photo-input").setInputFiles(MUG);
  await page.getByRole("button", { name: "Usar esta" }).click();

  await page.getByLabel("Teléfono (WhatsApp)").fill(local);
  await expect(page.getByTestId("prefilled-note")).toBeVisible();
  await expect(page.getByLabel("Nombre completo")).toHaveValue("ZZ Test");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("zz-prefill@example.com");

  await page.getByLabel("Acepto la política de recolección").check();
  await page.getByRole("button", { name: "Registrar mi pieza" }).click();
  await expect(page.getByTestId("piece-success")).toBeVisible();
  const { data } = await db.from("pieces").select("booking_id").eq("phone", `+52${local}`).single();
  expect(data?.booking_id).toBe(bookingId);
});

test("check in a piece → code is shown", async ({ page }) => {
  await page.goto("/pieza");
  await page.getByTestId("photo-input").setInputFiles(MUG);
  await page.getByRole("button", { name: "Usar esta" }).click();
  await fillPieceForm(page);
  await page.getByRole("button", { name: "Registrar mi pieza" }).click();
  await expect(page.getByTestId("piece-success")).toContainText(/C-\d{4,}/);
});
