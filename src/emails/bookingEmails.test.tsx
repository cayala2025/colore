import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import BookingConfirmation, { bookingConfirmationSubject } from "./BookingConfirmation";
import BookingReminder, { bookingReminderSubject } from "./BookingReminder";

const data = { name: "Ana López", date: "2026-10-08", start: "16:00", end: "18:00", party: 2, manageToken: "tok123" };

describe("booking confirmation email", () => {
  it("has a Spanish subject with the date", () => {
    expect(bookingConfirmationSubject(data)).toBe("Tu reservación en Colore: jueves 8 de octubre");
  });

  it("shows date, time, people, address and manage link", async () => {
    const html = await render(<BookingConfirmation {...data} />);
    expect(html).toContain("¡Listo, Ana!");
    expect(html).toContain("Jueves 8 de octubre");
    expect(html).toContain("16:00 – 18:00");
    expect(html).toContain("Mexicali");
    expect(html).toMatch(/href="https?:\/\/[^"]+\/r\/tok123"/);
  });
});

describe("booking reminder email", () => {
  it("asks to confirm or cancel with links to the manage page", async () => {
    expect(bookingReminderSubject()).toBe("Mañana pintas en Colore");
    const html = await render(<BookingReminder {...data} />);
    expect(html).toContain("¡Nos vemos mañana, Ana!");
    expect(html).toContain("16:00 – 18:00");
    expect(html).toMatch(/href="[^"]+\/r\/tok123\?accion=confirmar"/);
    expect(html).toMatch(/href="[^"]+\/r\/tok123\?accion=cancelar"/);
    expect(html).toContain(">Confirmar<");
    expect(html).toContain(">Cancelar<");
  });
});
