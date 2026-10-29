import { describe, expect, it } from "vitest";
import { accessFor } from "./access";

describe("accessFor", () => {
  it.each(["/cobro", "/cobro/", "/cobro/anything"])("lets admin and staff into %s, sends strangers to the cobro login", (p) => {
    expect(accessFor(p, "admin")).toBe("allow");
    expect(accessFor(p, "staff")).toBe("allow");
    expect(accessFor(p, null)).toBe("cobro-login");
  });

  it.each(["/admin", "/admin/", "/admin/cortes", "/admin/cortes/ajustes", "/admin/inventario", "/admin/piezas"])(
    "keeps %s admin-only: staff go back to cobro, strangers to the admin login",
    (p) => {
      expect(accessFor(p, "admin")).toBe("allow");
      expect(accessFor(p, "staff")).toBe("cobro");
      expect(accessFor(p, null)).toBe("admin-login");
    },
  );
});
