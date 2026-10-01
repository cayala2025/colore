// Cloudflare's documented always-pass test keys. Used in development (any hostname, e.g. a phone
// on the home Wi-Fi), because the real widget only allows the hostnames configured in Cloudflare.
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

type Env = { NODE_ENV?: string; NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string };

/** Real keys only in production builds; test keys everywhere else. */
export function turnstileSiteKey(env: Env): string {
  return env.NODE_ENV === "production" && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : TURNSTILE_TEST_SITE_KEY;
}

/** null in production without a secret: verification must fail closed. */
export function turnstileSecret(env: Env): string | null {
  if (env.NODE_ENV !== "production") return TURNSTILE_TEST_SECRET;
  return env.TURNSTILE_SECRET_KEY || null;
}
