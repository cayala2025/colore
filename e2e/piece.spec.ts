import { expect, test } from "@playwright/test";
import path from "node:path";
import { insertTodaysBooking } from "./db";
import { randomTestPhone } from "./helpers";

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
  await insertTodaysBooking(`+52${local}`, "zz-prefill@example.com");

  await page.goto("/pieza");
  await page.getByTestId("photo-input").setInputFiles(MUG);
  await page.getByRole("button", { name: "Usar esta" }).click();

  await page.getByLabel("Teléfono (WhatsApp)").fill(local);
  await expect(page.getByTestId("prefilled-note")).toBeVisible();
  await expect(page.getByLabel("Nombre completo")).toHaveValue("ZZ Test");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("zz-prefill@example.com");
});
