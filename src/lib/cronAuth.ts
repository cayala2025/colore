import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Fails closed when the secret is unset. */
export function isAuthorizedCron(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
