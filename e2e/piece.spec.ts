import { expect, test } from "@playwright/test";
import path from "node:path";
import { db } from "./db";
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

// Linking a piece to the customer's booking TODAY is not tested end-to-end: tests may only create
// bookings 50+ days ahead (the database is live). The privacy part is still checked here.
test("typing a phone never prefills name or email; the old lookup endpoint is gone", async ({ page }) => {
  const local = randomTestPhone();
  await page.goto("/pieza");
  await page.getByTestId("photo-input").setInputFiles(MUG);
  await page.getByRole("button", { name: "Usar esta" }).click();

  await page.getByLabel("Teléfono (WhatsApp)").fill(local);
  await page.waitForTimeout(500);
  await expect(page.getByLabel("Nombre completo")).toHaveValue("");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("");
  expect((await page.request.post("/api/pieces/lookup", { data: { country: "52", phone: local } })).status()).toBe(404);
});

test("check in a piece → code is shown", async ({ page }) => {
  await page.goto("/pieza");
  await page.getByTestId("photo-input").setInputFiles(MUG);
  await page.getByRole("button", { name: "Usar esta" }).click();
  await fillPieceForm(page);
  await page.getByRole("button", { name: "Registrar mi pieza" }).click();
  await expect(page.getByTestId("piece-code")).toHaveText(/^C-\d{4,}$/);
  await expect(page.getByTestId("piece-success")).toContainText("Muéstrale este código al staff");
  await expect(page.getByTestId("piece-success")).toContainText("Lista aproximadamente el");
  // Code fits a 375px screen.
  const box = await page.getByTestId("piece-code").boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: "test-results/piece-success.png" });

  const code = await page.getByTestId("piece-code").textContent();
  const { data: piece } = await db.from("pieces").select("id").eq("code", code!).single();
  await expect
    .poll(async () => {
      const { data } = await db.from("notifications_log").select("template, status").eq("piece_id", piece!.id);
      return data;
    })
    .toEqual([{ template: "piece_received", status: "sent" }]);
});
