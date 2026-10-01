import "server-only";
import { turnstileSecret } from "./turnstileKeys";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verify a Turnstile token server-side. Fails closed on any error. */
export async function verifyTurnstile(token: string | undefined | null, remoteIp?: string | null): Promise<boolean> {
  if (!token) return false;
  // Real secret in production; Cloudflare's test secret in development (see turnstileKeys.ts).
  const secret = turnstileSecret(process.env);
  if (!secret) return false;
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
