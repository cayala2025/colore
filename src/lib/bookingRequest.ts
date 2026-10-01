import { MAX_ONLINE_PARTY } from "./bookingWindow";
import { COUNTRY_CODES, toE164, type CountryCode } from "./phone";
import { hasErrors, validateContact } from "./validation";

export type BookingRequestBody = {
  date: string;
  start: string;
  party: number;
  name: string;
  country: CountryCode;
  phone: string;
  email: string;
  whatsappOptIn: boolean;
  privacy: boolean;
  turnstileToken: string;
};

export type ParsedBooking = {
  date: string;
  start: string;
  party: number;
  name: string;
  phone: string; // E.164
  email: string;
  whatsappOptIn: boolean;
  turnstileToken: string;
};

/** Validate and normalize an untrusted request body. Returns null when invalid. */
export function parseBookingRequest(body: unknown): ParsedBooking | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Partial<Record<keyof BookingRequestBody, unknown>>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const date = str(b.date);
  const start = str(b.start);
  const party = Number(b.party);
  const country = str(b.country) as CountryCode;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) return null;
  if (!Number.isInteger(party) || party < 1 || party > MAX_ONLINE_PARTY) return null;
  if (!COUNTRY_CODES.includes(country)) return null;

  const contact = {
    name: str(b.name).slice(0, 120),
    country,
    phone: str(b.phone),
    email: str(b.email),
    privacy: b.privacy === true,
  };
  if (hasErrors(validateContact(contact))) return null;

  return {
    date,
    start,
    party,
    name: contact.name.trim(),
    phone: toE164(country, contact.phone)!,
    email: contact.email.trim().toLowerCase(),
    whatsappOptIn: b.whatsappOptIn === true,
    turnstileToken: str(b.turnstileToken),
  };
}
