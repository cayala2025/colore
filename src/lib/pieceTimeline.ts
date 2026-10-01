// Piece timeline rules (days counted from check-in, in studio calendar days).
import { addDays } from "./calendar";
import { studioDaysBetween, toStudio } from "./time";

export const READY_DAYS = 14;
export const REMINDER_DAYS = [21, 30] as const;
export const FINAL_NOTICE_DAY = 40;
export const DONATE_DAY = 45;

export type PieceStatus = "received" | "firing" | "ready" | "picked_up" | "donated";

export const PIECE_TEMPLATES = [
  "piece_received",
  "piece_ready",
  "piece_reminder_21",
  "piece_reminder_30",
  "piece_final_notice",
] as const;
export type PieceTemplate = (typeof PIECE_TEMPLATES)[number];

/** Studio date when the piece should be ready (check-in date + READY_DAYS). */
export function readyDate(checkedInAt: Date): string {
  return addDays(toStudio(checkedInAt).date, READY_DAYS);
}

/** Days the pickup clock is shifted when a piece became ready after day 14 (delayed firing). */
/**
 * Pickup days run from the day staff marked the piece ready: every piece gets
 * PICKUP_DAYS (31) days between "lista" and donation, wherever it was ready early or late.
 * Milestones keep their check-in names (21, 30, 40, 45 = ready + 7, 16, 26, 31).
 */
export const PICKUP_DAYS = DONATE_DAY - READY_DAYS;

/** Days to shift the check-in timeline so it counts from the ready date (negative if ready early). */
export function pickupShift(checkedInAt: Date, readyAt: Date | null): number {
  return readyAt ? studioDaysBetween(checkedInAt, readyAt) - READY_DAYS : 0;
}

/** Last studio date the customer can pick up the piece (the day before donation). */
export function lastPickupDate(checkedInAt: Date, readyAt: Date | null = null): string {
  return addDays(toStudio(checkedInAt).date, DONATE_DAY - 1 + pickupShift(checkedInAt, readyAt));
}

export type PieceTimelineInput = {
  checkedInAt: Date;
  now: Date;
  status: PieceStatus;
  /** When staff marked the piece ready. */
  readyAt: Date | null;
  /** Templates already logged for this piece. */
  sent: ReadonlySet<PieceTemplate>;
  /** A message already went out to this piece today (studio date): send nothing more today. */
  sentToday?: boolean;
};

export type PieceTimelineAction = {
  /** Days since check-in (studio calendar days). */
  day: number;
  /** The one message to send today, if any. */
  send: PieceTemplate | null;
  /** Move status to "donated" (no message). */
  donate: boolean;
};

/**
 * Decide what is due for a piece today. At most one message per day (also across job runs,
 * via `sentToday`):
 * - picked_up / donated: nothing, ever.
 * - Not ready (received / firing): only the "received" message (as a backup if it failed). Pieces are
 *   never moved to "ready" automatically: staff marks them, and that sends "lista" right away.
 *   Pieces past day 14 that aren't ready show up in the admin "Revisar" list instead.
 * - Ready: "lista" first (backup if the instant send failed), then the latest pickup milestone reached
 *   (ready + 7, + 16, final notice + 26). Missed milestones are skipped, never sent in bulk.
 * - Donation at ready + 31, and only after the final notice was sent.
 */
export function pieceTimeline(input: PieceTimelineInput): PieceTimelineAction {
  const action = decide(input);
  return input.sentToday ? { ...action, send: null } : action;
}

function decide(input: PieceTimelineInput): PieceTimelineAction {
  const { checkedInAt, now, status, readyAt, sent } = input;
  const day = studioDaysBetween(checkedInAt, now);
  const none = { day, send: null, donate: false };

  if (status === "picked_up" || status === "donated") return none;
  if (status !== "ready") return { ...none, send: sent.has("piece_received") ? null : "piece_received" };
  if (!sent.has("piece_ready")) return { ...none, send: "piece_ready" };

  // Check-in-style day, counted from the ready date.
  const pickupDay = day - pickupShift(checkedInAt, readyAt);

  if (pickupDay >= FINAL_NOTICE_DAY) {
    if (!sent.has("piece_final_notice")) return { ...none, send: "piece_final_notice" };
    return { ...none, donate: pickupDay >= DONATE_DAY };
  }

  // Latest reminder milestone reached; older missed ones are skipped.
  const milestone = [...REMINDER_DAYS].reverse().find((d) => pickupDay >= d);
  if (!milestone) return none;
  const template = `piece_reminder_${milestone}` as PieceTemplate;
  const laterSent = REMINDER_DAYS.some((d) => d >= milestone && sent.has(`piece_reminder_${d}` as PieceTemplate));
  return { ...none, send: laterSent ? null : template };
}

/** Not marked ready although READY_DAYS have passed: staff should check the kiln ("Revisar"). */
export function needsReview(p: { status: PieceStatus; checkedInAt: Date }, now: Date): boolean {
  return (p.status === "received" || p.status === "firing") && studioDaysBetween(p.checkedInAt, now) >= READY_DAYS;
}
