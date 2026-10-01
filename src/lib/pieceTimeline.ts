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
export function pickupShift(checkedInAt: Date, readyAt: Date | null): number {
  return readyAt ? Math.max(0, studioDaysBetween(checkedInAt, readyAt) - READY_DAYS) : 0;
}

/** Last studio date the customer can pick up the piece (the day before donation). */
export function lastPickupDate(checkedInAt: Date, readyAt: Date | null = null): string {
  return addDays(toStudio(checkedInAt).date, DONATE_DAY - 1 + pickupShift(checkedInAt, readyAt));
}

export type PieceTimelineInput = {
  checkedInAt: Date;
  now: Date;
  status: PieceStatus;
  delayed: boolean;
  /** When staff (or the job) marked the piece ready. */
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
  /** Move status to "ready" (day 14 reached and not delayed). */
  markReady: boolean;
  /** Move status to "donated" (no message). */
  donate: boolean;
};

/**
 * Decide what is due for a piece today. At most one message per day (also across job runs,
 * via `sentToday`):
 * - picked_up / donated: nothing, ever.
 * - Not ready yet (before day 14, or delayed): only the "received" message (as a backup if it failed).
 * - Ready (marked by staff, or day 14 and not delayed): "ready" first, then the latest pickup milestone
 *   reached (21, 30, 40). Missed milestones are skipped, never sent in bulk.
 * - Pieces that became ready late (delayed) shift the pickup clock, so there are always
 *   DONATE_DAY - READY_DAYS days between "ready" and donation.
 * - Donation (day 45) only after the final notice was sent.
 */
export function pieceTimeline(input: PieceTimelineInput): PieceTimelineAction {
  const action = decide(input);
  return input.sentToday ? { ...action, send: null } : action;
}

function decide(input: PieceTimelineInput): PieceTimelineAction {
  const { checkedInAt, now, status, delayed, readyAt, sent } = input;
  const day = studioDaysBetween(checkedInAt, now);
  const none = { day, send: null, markReady: false, donate: false };

  if (status === "picked_up" || status === "donated") return none;

  const autoReady = !delayed && day >= READY_DAYS && (status === "received" || status === "firing");
  if (status !== "ready" && !autoReady) {
    return { ...none, send: sent.has("piece_received") ? null : "piece_received" };
  }

  const markReady = autoReady;
  if (!sent.has("piece_ready")) return { ...none, send: "piece_ready", markReady };

  // Shift the pickup clock when the piece became ready after day 14.
  const pickupDay = day - (status === "ready" ? pickupShift(checkedInAt, readyAt) : 0);

  if (pickupDay >= FINAL_NOTICE_DAY) {
    if (!sent.has("piece_final_notice")) return { ...none, send: "piece_final_notice", markReady };
    return { ...none, markReady, donate: pickupDay >= DONATE_DAY };
  }

  // Latest reminder milestone reached; older missed ones are skipped.
  const milestone = [...REMINDER_DAYS].reverse().find((d) => pickupDay >= d);
  if (!milestone) return { ...none, markReady };
  const template = `piece_reminder_${milestone}` as PieceTemplate;
  const laterSent = REMINDER_DAYS.some((d) => d >= milestone && sent.has(`piece_reminder_${d}` as PieceTemplate));
  return { ...none, markReady, send: laterSent ? null : template };
}
