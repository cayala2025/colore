import { es } from "@/content/es";
import { formatDateLong } from "../format";
import { e164Digits } from "../phone";
import { manageUrl } from "../site";
import { waLink } from "../waLink";

const firstName = (name: string) => name.trim().split(/\s+/)[0];

/** wa.me link to the customer with a prefilled booking reminder. */
export function bookingWhatsappLink(b: { name: string; phone: string; date: string; start_time: string; manage_token: string }) {
  const text = es.admin.whatsapp.bookingReminder(
    firstName(b.name),
    formatDateLong(b.date),
    b.start_time.slice(0, 5),
    manageUrl(b.manage_token),
  );
  return waLink(e164Digits(b.phone), text);
}

/** wa.me link to the customer with a prefilled piece message (ready, or pickup reminder). */
export function pieceWhatsappLink(
  p: { name: string; phone: string; code: string },
  kind: "ready" | "reminder",
  lastPickupDate: string,
) {
  const make = kind === "ready" ? es.admin.whatsapp.pieceReady : es.admin.whatsapp.pieceReminder;
  return waLink(e164Digits(p.phone), make(firstName(p.name), p.code, formatDateLong(lastPickupDate)));
}
