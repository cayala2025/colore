import { expect, test } from "@playwright/test";
import { db, insertPiece, pieceState } from "./db";

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

  await page.goto("/admin/piezas?q=test");
  await expect(page.getByTestId("search-results")).toContainText("TEST");

  await page.goto("/admin/piezas?q=nadie-se-llama-asi-xyz");
  await expect(page.getByText("No encontramos piezas")).toBeVisible();
});

test("piece buttons: en horno → retrasada → lista (sends email) → entregada", async ({ page }) => {
  const piece = await insertPiece(4);
  await page.goto(`/admin/piezas?q=${piece.code}`);
  const card = page.getByTestId(`piece-${piece.code}`);

  await card.getByRole("button", { name: "Marcar en horno" }).click();
  await expect(card).toContainText("En horno");
  await card.getByRole("button", { name: "Retrasada" }).click();
  await expect(card.getByText("Retrasada", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Marcar lista" }).click();
  await expect(card).toContainText("Lista");
  await expect(card.getByText("Retrasada", { exact: true })).toHaveCount(0);

  await expect
    .poll(async () => (await pieceState(piece.id)).templates)
    .toEqual(["piece_ready"]);

  await card.getByRole("button", { name: "Entregada" }).click();
  await expect(card).toContainText("Recogida");
  await expect(card.getByRole("button")).toHaveCount(0);
  expect((await pieceState(piece.id)).status).toBe("picked_up");
});

test("bulk select a kiln load → marcar lista", async ({ page }) => {
  const a = await insertPiece(6, { status: "firing" });
  const b = await insertPiece(6, { status: "firing" });
  const c = await insertPiece(6, { status: "firing" });
  await page.goto("/admin/piezas");
  const column = page.getByTestId("column-firing");
  await column.getByLabel(`Seleccionar ${a.code}`).check();
  await column.getByLabel(`Seleccionar ${b.code}`).check();
  await expect(page.getByTestId("bulk-bar")).toContainText("2 piezas seleccionadas");
  await page.getByTestId("bulk-bar").getByRole("button", { name: "Marcar lista" }).click();
  await expect(page.getByTestId("bulk-done")).toContainText("2 piezas marcadas");

  await expect(page.getByTestId("column-ready").getByTestId(`piece-${a.code}`)).toBeVisible();
  await expect(page.getByTestId("column-ready").getByTestId(`piece-${b.code}`)).toBeVisible();
  await expect(page.getByTestId("column-firing").getByTestId(`piece-${c.code}`)).toBeVisible();
  await expect.poll(async () => (await pieceState(a.id)).templates).toEqual(["piece_ready"]);
});

test("Por donar lists donated pieces and ones about to be donated", async ({ page }) => {
  const soon = await insertPiece(41, { status: "ready", readyDaysAgo: 27 });
  const donated = await insertPiece(46, { status: "ready", readyDaysAgo: 32 });
  await db.from("pieces").update({ status: "donated", donated_at: new Date().toISOString() }).eq("id", donated.id);

  await page.goto("/admin/piezas");
  await page.getByRole("link", { name: "Por donar" }).click();
  await expect(page.getByTestId("donate-due").getByTestId(`piece-${donated.code}`)).toBeVisible();
  await expect(page.getByTestId("donate-soon").getByTestId(`piece-${soon.code}`)).toContainText("Último día");

  // A late customer can still pick up a donated piece that hasn't left yet.
  await page.getByTestId(`piece-${donated.code}`).getByRole("button", { name: "Entregada" }).click();
  await expect(page.getByTestId("donate-due").getByTestId(`piece-${donated.code}`)).toHaveCount(0);
});

test("Enviar WhatsApp on ready pieces", async ({ page }) => {
  const piece = await insertPiece(16, { status: "ready", readyDaysAgo: 2 });
  await page.goto("/admin/piezas");
  const link = page.getByTestId("column-ready").getByTestId(`piece-${piece.code}`).getByRole("link", { name: "Enviar WhatsApp" });
  await expect(link).toHaveAttribute("href", new RegExp(`^https://wa\\.me/52555\\d{7}\\?text=.*${piece.code}.*lista`));
});

test("Revisar: pieces not ready after 14 days are listed, with a count on Hoy", async ({ page }) => {
  const late = await insertPiece(15, { status: "firing" });
  const fresh = await insertPiece(5);

  await page.goto("/admin");
  await expect(page.getByTestId("review-banner")).toContainText("14 días o más");
  await page.getByTestId("review-banner").click();
  await expect(page).toHaveURL(/\/admin\/piezas#revisar$/);
  const list = page.getByTestId("review-list");
  await expect(list.getByTestId(`piece-${late.code}`)).toBeVisible();
  await expect(list.getByTestId(`piece-${fresh.code}`)).toHaveCount(0);

  // Marking it ready removes it from the list and sends "lista" now.
  await list.getByTestId(`piece-${late.code}`).getByRole("button", { name: "Marcar lista" }).click();
  await expect(list.getByTestId(`piece-${late.code}`)).toHaveCount(0);
  await expect.poll(async () => (await pieceState(late.id)).templates).toEqual(["piece_ready"]);
});
