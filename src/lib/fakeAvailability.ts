// Temporary fake availability for the Sprint 1 UI. Replaced by the real API in Sprint 2.
import { isoWeekday } from "./calendar";
import type { DaySlot } from "./types";

const TIMES: [string, string][] = [
  ["11:00", "13:00"],
  ["16:00", "18:00"],
  ["18:00", "20:00"],
  ["20:00", "22:00"],
];

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function fakeSlotsFor(date: string): DaySlot[] {
  const weekday = isoWeekday(date);
  if (weekday === 1) return [];
  const times = weekday <= 3 ? TIMES.slice(0, 3) : TIMES;
  return times.map(([start, end]) => {
    const booked = hash(date + start) % 31;
    return { start, end, capacity: 30, seatsLeft: 30 - booked };
  });
}
