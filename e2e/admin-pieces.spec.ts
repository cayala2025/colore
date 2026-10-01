import { expect, test } from "@playwright/test";
import { insertPiece } from "./db";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
});

test("board shows pieces in Recibida / En horno / Lista / Recogida", async ({ page }) => {
  const received = await insertPiece(2);
  const firing = await insertPiece(5, { status: "firing" });
  const ready = await insertPiece(15, { status: "ready", readyDaysAgo: 1 });
  await page.goto("/admin/piezas");
  await expect(page.getByTestId("column-received").getByTestId(`piece-${received.code}`)).toContainText("Día 2");
  await expect(page.getByTestId("column-firing").getByTestId(`piece-${firing.code}`)).toBeVisible();
  await expect(page.getByTestId("column-ready").getByTestId(`piece-${ready.code}`)).toBeVisible();
  await expect(page.getByTestId("column-picked_up")).toContainText("Recogida");
});
