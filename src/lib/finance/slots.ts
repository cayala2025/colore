import { addDays, weekdayMon0 } from "../calendar";

export const SLOT_LABELS = ["11–13", "16–18", "18–20", "20–22"] as const;
export const OFF_SHIFT = "Fuera de turno";

const SHIFTS: { label: string; from: string; to: string }[] = [
  { label: "11–13", from: "11:00", to: "13:00" },
  { label: "16–18", from: "16:00", to: "18:00" },
  { label: "18–20", from: "18:00", to: "20:00" },
  { label: "20–22", from: "20:00", to: "22:00" },
];

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/**
 * Slot label for a studio-local "HH:MM" time. A time outside every slot still counts for the next slot
 * when it falls within `graceMinutes` before that slot starts (early arrivals).
 */
export function slotLabelFor(time: string, graceMinutes = 0): string {
  const inside = SHIFTS.find((s) => time >= s.from && time < s.to);
  if (inside) return inside.label;
  const early = SHIFTS.find((s) => minutes(s.from) - minutes(time) > 0 && minutes(s.from) - minutes(time) <= graceMinutes);
  return early?.label ?? OFF_SHIFT;
}

/** Monday–Sunday range containing `date`. */
export function weekRange(date: string): { start: string; end: string; days: string[] } {
  const start = addDays(date, -weekdayMon0(date));
  return { start, end: addDays(start, 6), days: Array.from({ length: 7 }, (_, i) => addDays(start, i)) };
}

/** Closed slots: Monday all day; 20–22 on Tuesday, Wednesday and Sunday. */
export function isSlotClosed(date: string, label: string): boolean {
  const wd = weekdayMon0(date);
  if (wd === 0) return true;
  return label === "20–22" && (wd === 1 || wd === 2 || wd === 6);
}

/** Pieces sold per day × slot for a week. Rows follow `days`, columns follow SLOT_LABELS. */
export function heatmap(days: string[], sales: { studioDate: string; slotLabel: string; pieces: number }[]) {
  const cells = days.map((date) =>
    SLOT_LABELS.map((label) => ({
      date,
      label,
      closed: isSlotClosed(date, label),
      pieces: sales.filter((s) => s.studioDate === date && s.slotLabel === label).reduce((n, s) => n + s.pieces, 0),
    })),
  );
  const max = Math.max(0, ...cells.flat().map((c) => c.pieces));
  return { cells, max };
}
