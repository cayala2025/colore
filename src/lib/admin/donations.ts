import { addDays } from "../calendar";
import { lastPickupDate } from "../pieceTimeline";
import { toStudio } from "../time";
import type { AdminPiece } from "./pieceBoard";

export const SOON_DAYS = 5;

export type DonationLists = {
  /** Already moved to "donated" by the daily job: pull them off the shelf. */
  due: (AdminPiece & { donatedOn: string })[];
  /** Still waiting, last pickup day within SOON_DAYS. */
  soon: (AdminPiece & { lastDay: string })[];
};

export function donationLists(pieces: (AdminPiece & { donated_at?: string | null })[], now: Date): DonationLists {
  const today = toStudio(now).date;
  const due = pieces
    .filter((p) => p.status === "donated" && p.donated_at)
    .map((p) => ({ ...p, donatedOn: toStudio(new Date(p.donated_at!)).date }))
    .sort((a, b) => a.donatedOn.localeCompare(b.donatedOn));
  const soon = pieces
    .filter((p) => p.status === "ready")
    .map((p) => ({ ...p, lastDay: lastPickupDate(new Date(p.checked_in_at), p.ready_at ? new Date(p.ready_at) : null) }))
    .filter((p) => p.lastDay <= addDays(today, SOON_DAYS))
    .sort((a, b) => a.lastDay.localeCompare(b.lastDay));
  return { due, soon };
}
