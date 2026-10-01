import { addDays } from "./calendar";
import { toStudio } from "./time";

// Piece timeline rules (days counted from check-in, studio calendar days).

export const READY_DAYS = 14;
export const REMINDER_DAYS = [21, 30] as const;
export const FINAL_NOTICE_DAY = 40;
export const DONATE_DAY = 45;

/** Studio date when the piece should be ready (check-in date + READY_DAYS). */
export function readyDate(checkedInAt: Date): string {
  return addDays(toStudio(checkedInAt).date, READY_DAYS);
}
