import Link from "next/link";
import { connection } from "next/server";
import { es } from "@/content/es";
import { getAdminWeek } from "@/lib/admin/queries";
import { mondayOf } from "@/lib/admin/week";
import { requireAdmin } from "@/lib/adminAuth";
import { SEAT_HOLDING_STATUSES } from "@/lib/availability";
import { addDays, parseIsoDate } from "@/lib/calendar";
import { formatTimeRange } from "@/lib/format";
import { todayInStudio } from "@/lib/time";

const navBtn = "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";
const MAX_NAMES = 4;

function shortDate(date: string) {
  const { day, month } = parseIsoDate(date);
  return `${day} ${es.booking.date.months[month - 1].slice(0, 3)}`;
}

export default async function AdminCalendarPage({ searchParams }: PageProps<"/admin/calendario">) {
  await requireAdmin();
  await connection();
  const { semana } = await searchParams;
  const today = todayInStudio();
  const base = typeof semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? semana : today;
  const monday = mondayOf(base);
  const week = await getAdminWeek(monday);
  const t = es.admin.calendar;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.weekOf(shortDate(monday), shortDate(addDays(monday, 6)))}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/calendario?semana=${addDays(monday, -7)}`} className={navBtn} aria-label={t.prevWeek}>
            ‹
          </Link>
          {monday !== mondayOf(today) && (
            <Link href="/admin/calendario" className={navBtn}>
              {t.thisWeek}
            </Link>
          )}
          <Link href={`/admin/calendario?semana=${addDays(monday, 7)}`} className={navBtn} aria-label={t.nextWeek}>
            ›
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {week.map((day, i) => (
          <section
            key={day.date}
            data-testid={`day-${day.date}`}
            className={`rounded-card border bg-surface p-3 ${day.date === today ? "border-accent" : "border-line"}`}
          >
            <Link href={`/admin?fecha=${day.date}`} className="block min-h-11 hover:text-accent" title={t.openDay}>
              <p className="text-xs font-medium uppercase text-muted">{es.booking.date.weekdaysLong[i]}</p>
              <p className="font-semibold">{shortDate(day.date)}</p>
            </Link>
            {day.blocked ? (
              <p className="mt-2 text-xs font-medium text-danger">{t.blocked}</p>
            ) : day.slots.length === 0 ? (
              <p className="mt-2 text-xs text-muted">{t.closed}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {day.slots.map((slot) => {
                  const active = slot.bookings.filter((b) => SEAT_HOLDING_STATUSES.includes(b.status));
                  return (
                    <li key={slot.start} className="rounded-lg bg-bg p-2 text-xs">
                      <div className="flex justify-between gap-1 font-medium">
                        <span>{formatTimeRange(slot.start, slot.end)}</span>
                        <span className={slot.free === 0 ? "text-danger" : "text-muted"}>
                          {t.seats(slot.used, slot.capacity)}
                        </span>
                      </div>
                      {active.length > 0 && (
                        <ul className="mt-1 text-muted">
                          {active.slice(0, MAX_NAMES).map((b) => (
                            <li key={b.id} className="truncate">
                              {b.name} · {b.party_size}
                            </li>
                          ))}
                          {active.length > MAX_NAMES && <li>{t.more(active.length - MAX_NAMES)}</li>}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
