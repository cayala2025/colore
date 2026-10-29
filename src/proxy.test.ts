import { describe, expect, it } from "vitest";
import { config } from "./proxy";

// Next matcher syntax used here: "/x" (exact) and "/x/:path*" (anything under /x).
function gated(pathname: string): boolean {
  return config.matcher.some((m) => (m.endsWith("/:path*") ? pathname.startsWith(`${m.slice(0, -"/:path*".length)}/`) : pathname === m));
}

describe("proxy matcher", () => {
  it.each(["/admin", "/admin/", "/admin/piezas", "/admin/cortes/ajustes", "/cobro", "/cobro/"])("gates %s", (p) => expect(gated(p)).toBe(true));
  it.each(["/", "/pieza", "/r/abc123", "/api/availability", "/api/bookings", "/api/pieces", "/administrador", "/cobros"])("does not gate %s", (p) => expect(gated(p)).toBe(false));
});
