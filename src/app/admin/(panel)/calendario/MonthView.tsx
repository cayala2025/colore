import Link from "next/link";
import { es } from "@/content/es";
import type { FullnessLevel } from "@/lib/admin/month";
import { fullness } from "@/lib/admin/month";
import { getAdminMonth } from "@/lib/admin/queries";
import { addMonths, monthGrid, monthOf, parseIsoDate } from "@/lib/calendar";
import { formatDateLong } from "@/lib/format";
import { navBtn } from "./shared";
import { ViewSwitch } from "./ViewSwitch";

/** Cell colors by how full a day is (design tokens only). */
const LEVEL_CLASS: Record<FullnessLevel, string> = {
  empty: "bg-surface",
  low: "bg-accent-soft",
  medium: "bg-accent/30",
  high: "bg-accent/60",
  full: "bg-accent text-accent-ink",
};
const LEVELS: FullnessLevel[] = ["empty", "low", "medium", "high", "full"];

/** Month view: one cell per day with people booked vs capacity, colored by how full it is. */
export async function MonthView({ month, today }: { month: string; today: string }) {
  const { days, summary } = await getAdminMonth(month);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const t = es.admin.calendar;
  const { year, month: m } = parseIsoDate(`${month}-01`);
  const weekStart = monthOf(today) === month ? today : `${month}-01`;

  return (
    <div className="flex flex-col gap-4">
      <ViewSwitch view="mes" weekHref={`/admin/calendario?semana=${weekStart}`} monthHref={`/admin/calendario?vista=mes&mes=${month}`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold capitalize">{t.monthTitle(es.booking.date.months[m - 1], year)}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/calendario?vista=mes&mes=${addMonths(month, -1)}`} className={navBtn} aria-label={t.prevMonth}>
            ‹
          </Link>
          {month !== monthOf(today) && (
            <Link href="/admin/calendario?vista=mes" className={navBtn}>
              {t.thisMonth}
            </Link>
          )}
          <Link href={`/admin/calendario?vista=mes&mes=${addMonths(month, 1)}`} className={navBtn} aria-label={t.nextMonth}>
            ›
          </Link>
        </div>
      </div>

      <div data-testid="month-summary" className="rounded-card border border-line bg-surface p-3 text-sm">
        <p className="font-medium">{t.summary(summary.bookings, summary.people, summary.noShows)}</p>
        {summary.busiest && (
          <p className="text-muted first-letter:uppercase">{t.busiest(formatDateLong(summary.busiest.date), summary.busiest.people)}</p>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2" role="grid" aria-label={t.monthTitle(es.booking.date.months[m - 1], year)}>
        {es.booking.date.weekdaysShort.map((d, i) => (
          <div key={i} role="columnheader" className="pb-1 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {monthGrid(month).map((date, i) => {
          if (!date) return <div key={`blank-${i}`} role="gridcell" />;
          const day = byDate.get(date)!;
          const dayNum = parseIsoDate(date).day;
          const isToday = date === today;
          const muted = day.closed || day.blocked;
          return (
            <div key={date} role="gridcell">
              <Link
                href={`/admin?fecha=${date}`}
                data-testid={`month-day-${date}`}
                data-level={day.level}
                aria-label={day.closed ? `${dayNum} · ${t.closed}` : day.blocked ? `${dayNum} · ${t.blocked}` : t.dayLabel(formatDateLong(date), day.used, day.capacity)}
                className={`flex min-h-14 flex-col rounded-lg border p-1 text-left md:min-h-24 md:p-2 ${
                  isToday ? "border-accent ring-2 ring-accent" : "border-line"
                } ${muted ? "bg-bg text-muted" : LEVEL_CLASS[day.level]} hover:border-accent`}
              >
                <span className="text-sm font-semibold">{dayNum}</span>
                {day.blocked ? (
                  <span className="mt-auto truncate text-[10px] font-medium text-danger md:text-xs">{t.blocked}</span>
                ) : day.closed ? (
                  <span className="mt-auto hidden text-xs md:block">{t.closed}</span>
                ) : (
                  <>
                    <span className="mt-auto text-[10px] font-medium md:text-xs">{t.dayPeople(day.used, day.capacity)}</span>
                    {/* Per-slot bars on bigger screens only. */}
                    <span className="mt-1 hidden gap-0.5 md:flex" aria-hidden="true">
                      {day.slots.map((s) => (
                        <span key={s.start} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" title={s.start}>
                          <span
                            className={`block h-full ${fullness(s.used, s.capacity) === "full" ? "bg-danger" : "bg-ink/60"}`}
                            style={{ width: `${s.capacity ? Math.min(100, Math.round((s.used / s.capacity) * 100)) : 100}%` }}
                          />
                        </span>
                      ))}
                    </span>
                  </>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" aria-label={t.legendTitle}>
        <span className="font-medium">{t.legendTitle}:</span>
        {LEVELS.map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded border border-line ${LEVEL_CLASS[level]}`} />
            {t.legend[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
