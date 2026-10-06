import { es } from "@/content/es";
import { parseIsoDate } from "@/lib/calendar";

export const navBtn =
  "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";

/** "8 oct" */
export function shortDate(date: string) {
  const { day, month } = parseIsoDate(date);
  return `${day} ${es.booking.date.months[month - 1].slice(0, 3)}`;
}
