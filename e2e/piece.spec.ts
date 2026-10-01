import { expect, test } from "@playwright/test";
import path from "node:path";

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
