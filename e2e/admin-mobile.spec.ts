import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 740 } });

test("admin pages fit a 375px screen", async ({ page, context }) => {
  await context.addCookies([{ name: "e2e_admin", value: "1", url: "http://localhost:3100" }]);
  for (const path of ["/admin", "/admin/calendario", "/admin/calendario?vista=mes", "/admin/piezas", "/admin/horario", "/admin/bloqueos", "/admin/piezas/donar"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `test-results/admin${path.replace(/[/?=]/g, "-")}.png`, fullPage: true });
  }
});
