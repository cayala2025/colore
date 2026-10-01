import type { BookingStatus } from "./types";

export type ManageView = {
  canConfirm: boolean;
  canCancel: boolean;
  isPast: boolean;
};

/** What the customer can do from the /r/[token] page. */
export function manageView(b: { status: BookingStatus; starts_at: string; customer_confirmed_at: string | null }, now: Date): ManageView {
  const isPast = new Date(b.starts_at) <= now;
  const open = b.status === "confirmed" && !isPast;
  return { canConfirm: open && !b.customer_confirmed_at, canCancel: open, isPast };
}

export function isManageToken(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token);
}
