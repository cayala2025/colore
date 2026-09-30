import { toE164, type CountryCode } from "./phone";

export type ContactInput = {
  name: string;
  country: CountryCode;
  phone: string;
  email: string;
  privacy: boolean;
};

/** Keys match `es.booking.errors`. */
export type ContactErrorKey =
  | "nameRequired"
  | "nameTooShort"
  | "phoneRequired"
  | "phoneInvalid"
  | "emailRequired"
  | "emailInvalid"
  | "privacyRequired";

export type ContactErrors = Partial<Record<"name" | "phone" | "email" | "privacy", ContactErrorKey>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = "nameRequired";
  else if (name.length < 2) errors.name = "nameTooShort";

  if (!input.phone.trim()) errors.phone = "phoneRequired";
  else if (!toE164(input.country, input.phone)) errors.phone = "phoneInvalid";

  const email = input.email.trim();
  if (!email) errors.email = "emailRequired";
  else if (!EMAIL_RE.test(email) || email.length > 254) errors.email = "emailInvalid";

  if (!input.privacy) errors.privacy = "privacyRequired";
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
