import "server-only";

/** Cloudflare's documented test secret: every token passes. Used only outside production. */
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verify a Turnstile token server-side. Fails closed on any error. */
export async function verifyTurnstile(token: string | undefined | null, remoteIp?: string | null): Promise<boolean> {
  if (!token) return false;
  let secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    console.warn("[turnstile] TURNSTILE_SECRET_KEY missing: using Cloudflare test secret (dev only)");
    secret = TURNSTILE_TEST_SECRET;
  }
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form, signal: AbortSignal.timeout(8000) });
    const body = (await res.json()) as { success?: boolean };
    return body.success === true;
  } catch (err) {
    console.error("[turnstile] verification request failed", err);
    return false;
  }
}
