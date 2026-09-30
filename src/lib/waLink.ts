/**
 * Build a wa.me link. Returns "#" when there is no number (e.g. during development,
 * before Colore has its WhatsApp number). Never hardcode a number.
 */
export function waLink(number: string | undefined | null, text: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return "#";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Colore's own WhatsApp number, from env (digits only). May be empty. */
export const studioWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
