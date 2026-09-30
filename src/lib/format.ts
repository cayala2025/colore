import { es } from "@/content/es";
import { parseIsoDate, weekdayMon0 } from "./calendar";

/** "jueves 1 de octubre" */
export function formatDateLong(date: string): string {
  const { day, month } = parseIsoDate(date);
  return es.format.dateLong(es.booking.date.weekdaysLong[weekdayMon0(date)], day, es.booking.date.months[month - 1]);
}

/** "16:00 – 18:00" */
export function formatTimeRange(start: string, end: string): string {
  return es.format.timeRange(start.slice(0, 5), end.slice(0, 5));
}
