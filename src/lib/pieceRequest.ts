import { COUNTRY_CODES, toE164, type CountryCode } from "./phone";
import { hasErrors, validateContact } from "./validation";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ParsedPiece = {
  name: string;
  phone: string; // E.164
  email: string;
  whatsappOptIn: boolean;
  turnstileToken: string;
};

/** Validate the text fields of a piece check-in (multipart form). Returns null when invalid. */
export function parsePieceFields(get: (key: string) => unknown): ParsedPiece | null {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const country = str(get("country")) as CountryCode;
  if (!COUNTRY_CODES.includes(country)) return null;
  const contact = {
    name: str(get("name")).slice(0, 120),
    country,
    phone: str(get("phone")),
    email: str(get("email")),
    privacy: str(get("policy")) === "true",
  };
  if (hasErrors(validateContact(contact))) return null;
  return {
    name: contact.name.trim(),
    phone: toE164(country, contact.phone)!,
    email: contact.email.trim().toLowerCase(),
    whatsappOptIn: str(get("whatsappOptIn")) === "true",
    turnstileToken: str(get("turnstileToken")),
  };
}

export function isAcceptablePhoto(file: unknown): file is Blob {
  return file instanceof Blob && file.size > 0 && file.size <= MAX_PHOTO_BYTES && PHOTO_TYPES.includes(file.type);
}
