import type { BookingStatus } from "../types";

/** Status changes staff can make from the admin. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["attended", "no_show", "cancelled"],
  attended: ["confirmed", "no_show"], // undo a misclick
  no_show: ["confirmed", "attended"],
  cancelled: [], // re-booking goes through the normal flow (capacity check)
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
