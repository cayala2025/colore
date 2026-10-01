import { es } from "@/content/es";
import { formatDateLong } from "../format";
import { e164Digits } from "../phone";
import { lastPickupDate, pickupShift, REMINDER_DAYS } from "../pieceTimeline";
import { manageUrl } from "../site";
import { studioDaysBetween } from "../time";
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

/** WhatsApp link for a ready piece: "lista" text until the first pickup reminder is due, then the reminder text. */
export function readyPieceWhatsappLink(
  p: { name: string; phone: string; code: string; checked_in_at: string; ready_at: string | null },
  now: Date,
) {
  const checkedIn = new Date(p.checked_in_at);
  const readyAt = p.ready_at ? new Date(p.ready_at) : null;
  const pickupDay = studioDaysBetween(checkedIn, now) - pickupShift(checkedIn, readyAt);
  return pieceWhatsappLink(p, pickupDay >= REMINDER_DAYS[0] ? "reminder" : "ready", lastPickupDate(checkedIn, readyAt));
}
