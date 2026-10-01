// Timezone helpers. The studio runs on America/Tijuana; servers run in UTC.
// Never rely on the server timezone: always go through these helpers.
import { daysBetween } from "./calendar";

export const STUDIO_TZ = "America/Tijuana";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function wallClock(instant: Date): WallClock {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(partsFormatter.formatToParts(instant).find((p) => p.type === type)!.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Studio offset from UTC at an instant, in ms (e.g. -7h during PDT). */
function offsetMs(instant: Date): number {
  const w = wallClock(instant);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Studio calendar date and "HH:MM" time for an instant. */
export function toStudio(instant: Date): { date: string; time: string } {
  const w = wallClock(instant);
  return { date: `${w.year}-${pad(w.month)}-${pad(w.day)}`, time: `${pad(w.hour)}:${pad(w.minute)}` };
}

/** Today's calendar date in the studio, as "YYYY-MM-DD". */
export function todayInStudio(now: Date = new Date()): string {
  return toStudio(now).date;
}

/** The UTC instant of a studio-local date + "HH:MM[:SS]" time. */
export function studioToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm, ss);
  // Two passes handle DST transitions.
  let guess = wallAsUtc - offsetMs(new Date(wallAsUtc));
  guess = wallAsUtc - offsetMs(new Date(guess));
  return new Date(guess);
}

/** Whole studio calendar days from `from` to `to` (e.g. days since piece check-in). */
export function studioDaysBetween(from: Date, to: Date): number {
  return daysBetween(toStudio(from).date, toStudio(to).date);
}
