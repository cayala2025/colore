import { describe, expect, it } from "vitest";
import { bookingWhatsappLink, pieceWhatsappLink } from "./whatsappMessages";

describe("admin WhatsApp links", () => {
  it("booking reminder goes to the customer's number with the manage link", () => {
    const url = new URL(
      bookingWhatsappLink({ name: "Ana López", phone: "+526861234567", date: "2026-10-08", start_time: "16:00:00", manage_token: "tok" }),
    );
    expect(url.origin + url.pathname).toBe("https://wa.me/526861234567");
    const text = url.searchParams.get("text")!;
    expect(text).toContain("Hola Ana");
    expect(text).toContain("jueves 8 de octubre a las 16:00");
    expect(text).toMatch(/\/r\/tok$/);
  });

  it("piece messages work for US numbers too", () => {
    const url = new URL(pieceWhatsappLink({ name: "Bob", phone: "+17605551234", code: "C-0042" }, "ready", "2026-11-14"));
    expect(url.pathname).toBe("/17605551234");
    expect(url.searchParams.get("text")).toContain("tu pieza C-0042 ya está lista");
    expect(url.searchParams.get("text")).toContain("sábado 14 de noviembre");
    const reminder = new URL(pieceWhatsappLink({ name: "Bob", phone: "+17605551234", code: "C-0042" }, "reminder", "2026-11-14"));
    expect(reminder.searchParams.get("text")).toContain("te espera");
  });
});
