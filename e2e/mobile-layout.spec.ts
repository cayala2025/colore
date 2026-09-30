import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 375, height: 740 } });

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // Also catch elements pushed past the right edge but clipped by a parent.
  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main *"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > window.innerWidth + 0.5;
      })
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(offenders).toEqual([]);
}

test("booking page does not overflow at 375px", async ({ page }) => {
  await page.goto("/");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "2 personas" }).click();
  await page.locator("[data-date]:not([disabled])").first().click();
  await page.locator("[data-slot]:not([disabled])").first().click();
  await page.getByRole("button", { name: "Reservar" }).click(); // shows validation errors
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/mobile-375-full.png", fullPage: true });
});
