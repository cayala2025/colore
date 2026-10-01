/**
 * Test-only admin bypass for Playwright (no real Supabase Auth user needed).
 * Active ONLY when both hold: not a production build, and E2E_ADMIN_BYPASS=1
 * (set exclusively by playwright.config.ts). Vercel always builds with NODE_ENV=production.
 */
export function adminBypassEnabled(env: { NODE_ENV?: string; E2E_ADMIN_BYPASS?: string } = process.env): boolean {
  return env.NODE_ENV !== "production" && env.E2E_ADMIN_BYPASS === "1";
}

export const BYPASS_ADMIN_EMAIL = "e2e-admin@example.com";
