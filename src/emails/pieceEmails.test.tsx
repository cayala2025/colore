import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { PieceEmail, pieceEmailSubject, type PieceEmailData } from "./PieceEmail";

const data: PieceEmailData = {
  name: "Ana López",
  code: "C-0042",
  photoUrl: "https://example.supabase.co/storage/v1/object/sign/pieces/x.jpg?token=abc",
  readyDate: "2026-10-15",
  lastPickupDate: "2026-11-15",
};

describe("piece emails", () => {
  it("received: code, photo, ready date and 45-day policy", async () => {
    expect(pieceEmailSubject("received", data)).toBe("Recibimos tu pieza C-0042");
    const html = await render(<PieceEmail kind="received" data={data} />);
    expect(html).toContain("C-0042");
    expect(html).toContain('src="https://example.supabase.co/storage/v1/object/sign/pieces/x.jpg?token=abc"');
    expect(html).toContain("jueves 15 de octubre");
    expect(html).toContain("45 días");
  });

  it("ready, reminder and final notice include the last pickup date", async () => {
    for (const kind of ["ready", "reminder", "finalNotice"] as const) {
      const html = await render(<PieceEmail kind={kind} data={{ ...data, photoUrl: null }} />);
      expect(html).toContain("C-0042");
      expect(html).toContain("domingo 15 de noviembre");
      expect(html).not.toContain("<img");
    }
    expect(pieceEmailSubject("ready", data)).toBe("Tu pieza C-0042 está lista");
    expect(pieceEmailSubject("finalNotice", data)).toBe("Último aviso: tu pieza C-0042 se donará en 5 días");
  });
});
