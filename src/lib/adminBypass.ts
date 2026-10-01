/**
 * Test-only admin bypass for Playwright (no real Supabase Auth user needed).
 * Active ONLY when all hold: not a production build, E2E_ADMIN_BYPASS=1 (set exclusively by
 * playwright.config.ts), and the request carries the `e2e_admin=1` cookie (so tests without the
 * cookie exercise the real gate). Vercel always builds with NODE_ENV=production.
 */
export const BYPASS_COOKIE = "e2e_admin";
export const BYPASS_ADMIN_EMAIL = "e2e-admin@example.com";

export function adminBypassEnabled(
  cookieValue: string | undefined,
  env: { NODE_ENV?: string; E2E_ADMIN_BYPASS?: string } = process.env,
): boolean {
  return env.NODE_ENV !== "production" && env.E2E_ADMIN_BYPASS === "1" && cookieValue === "1";
}
