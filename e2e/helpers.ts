import { expect, type Page } from "@playwright/test";

/** Pick the first enabled date that has a slot fitting the party; returns the date and slot start. */
export async function pickFirstAvailableDateAndSlot(page: Page): Promise<{ date: string; start: string }> {
  for (let monthTries = 0; monthTries < 3; monthTries++) {
    await expect(page.getByText("Cargando disponibilidad…")).toHaveCount(0);
    const dates = page.locator("[data-date]:not([disabled])");
    const count = await dates.count();
    for (let i = 0; i < count; i++) {
      const dateBtn = dates.nth(i);
      const date = (await dateBtn.getAttribute("data-date"))!;
      await dateBtn.click();
      const slot = page.locator("[data-slot]:not([disabled])").first();
      if (await slot.isVisible().catch(() => false)) {
        const start = (await slot.getAttribute("data-slot"))!;
        await slot.click();
        return { date, start };
      }
    }
    await page.getByRole("button", { name: "Mes siguiente" }).click();
  }
  throw new Error("No available date/slot found");
}

/** Name used for every test booking (cancelled in global teardown). */
export const TEST_NAME = "ZZ Test";

/** Random 10-digit test phone (555 prefix) so runs never collide on "one booking per phone". */
export function randomTestPhone(): string {
  return `555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
}

export async function fillBookingForm(
  page: Page,
  { name = TEST_NAME, phone = randomTestPhone(), email = "zz-test@example.com" } = {},
) {
  await page.getByLabel("Nombre completo").fill(name);
  await page.getByLabel("Teléfono (WhatsApp)").fill(phone);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Acepto el aviso de privacidad").check();
  await expect(page.getByLabel("Quiero recibir avisos por WhatsApp")).toBeChecked();
}
