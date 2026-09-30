// Timezone helpers. The studio runs on America/Tijuana; servers run in UTC.
// Never rely on the server timezone: always go through these helpers.

export const STUDIO_TZ = "America/Tijuana";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STUDIO_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in the studio, as "YYYY-MM-DD". */
export function todayInStudio(now: Date = new Date()): string {
  return ymdFormatter.format(now);
}
