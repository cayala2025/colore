import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const MIN_CODE_LENGTH = 4;

/** Hash for storing the admin discount code: "scrypt$<salt>$<hash>" (hex). The plain code is never stored. */
export function hashDiscountCode(code: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(code, salt, 32).toString("hex")}`;
}

/** True when `code` matches the stored hash. No stored hash means discounts are disabled. */
export function verifyDiscountCode(code: string, stored: string | null | undefined): boolean {
  if (!stored || !code) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(code, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
