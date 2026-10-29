/** Who may open which route. Pure, so the proxy gate can be unit tested. */
export type Role = "admin" | "staff";
export type Access = "allow" | "admin-login" | "cobro-login" | "cobro";

export function accessFor(pathname: string, role: Role | null): Access {
  const inCobro = pathname === "/cobro" || pathname.startsWith("/cobro/");
  if (inCobro) return role ? "allow" : "cobro-login";
  if (role === "admin") return "allow";
  return role === "staff" ? "cobro" : "admin-login";
}
