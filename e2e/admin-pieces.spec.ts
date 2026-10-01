import { expect, test } from "@playwright/test";
import { db, insertPiece } from "./db";

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

test("search by code, phone or name", async ({ page }) => {
  const piece = await insertPiece(3);
  const number = piece.code.replace("C-", "").replace(/^0+/, "");

  await page.goto("/admin/piezas");
  await page.getByLabel("Buscar pieza").fill(number);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByTestId("search-results").getByTestId(`piece-${piece.code}`)).toBeVisible();

  const { data } = await db.from("pieces").select("phone").eq("id", piece.id).single();
  await page.goto(`/admin/piezas?q=${encodeURIComponent(data!.phone.slice(-7))}`);
  await expect(page.getByTestId(`piece-${piece.code}`)).toBeVisible();

  await page.goto("/admin/piezas?q=zz%20test");
  await expect(page.getByTestId("search-results")).toContainText("ZZ Test");

  await page.goto("/admin/piezas?q=nadie-se-llama-asi-xyz");
  await expect(page.getByText("No encontramos piezas")).toBeVisible();
});
