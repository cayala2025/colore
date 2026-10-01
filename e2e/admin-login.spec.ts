import { expect, test } from "@playwright/test";

test("admin login page renders the form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Entrar al admin" })).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("admin login shows the not-admin message", async ({ page }) => {
  await page.goto("/admin/login?error=not_admin");
  await expect(page.getByText("Este correo no tiene acceso al admin.")).toBeVisible();
});
