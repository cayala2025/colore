// Phone helpers. Stored format is E.164. Default country +52 (Mexico); +1 allowed (US).

export type CountryCode = "52" | "1";
export const COUNTRY_CODES: CountryCode[] = ["52", "1"];

/**
 * Normalize a national number typed by a customer into E.164.
 * Accepts spaces, dashes, parentheses and a repeated country prefix
 * (e.g. "52 686 123 4567" or the old Mexican mobile "521…").
 * Returns null when it is not a valid 10-digit number.
 */
export function toE164(country: CountryCode, input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (country === "52") {
    if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
    else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (!/^\d{10}$/.test(digits)) return null;
  // Neither Mexican nor NANP numbers start with 0; NANP area codes don't start with 1.
  if (digits.startsWith("0")) return null;
  if (country === "1" && digits.startsWith("1")) return null;
  return `+${country}${digits}`;
}

export function isE164(value: string): boolean {
  return /^\+(52|1)\d{10}$/.test(value);
}

/** Digits only (for wa.me links). */
export function e164Digits(e164: string): string {
  return e164.replace(/\D/g, "");
}
