import { loadEnvConfig } from "@next/env";
import { expect, test } from "@playwright/test";

loadEnvConfig(process.cwd());

test("admin pages redirect to login when not signed in", async ({ page }) => {
  for (const path of ["/admin", "/admin/piezas", "/admin/horario"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});

test("a forged Supabase auth cookie is rejected", async ({ page, context }) => {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  expect(ref).toMatch(/^[a-z0-9]{20}$/);
  await context.addCookies([
    { name: `sb-${ref}-auth-token`, value: "base64-eyJhY2Nlc3NfdG9rZW4iOiJmb3JnZWQifQ", url: "http://localhost:3100" },
  ]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("signed-in admin (test bypass) sees the panel", async ({ page, context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("navigation")).toContainText("Piezas");
});
