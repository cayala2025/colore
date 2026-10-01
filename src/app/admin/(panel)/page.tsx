import Link from "next/link";
import { connection } from "next/server";
import { BookingActions } from "@/components/admin/BookingActions";
import { DaySlotCard } from "@/components/admin/DaySlotCard";
import { WhatsAppButton } from "@/components/admin/WhatsAppButton";
import { es } from "@/content/es";
import { getAdminDay, getReviewPieces } from "@/lib/admin/queries";
import { bookingWhatsappLink } from "@/lib/admin/whatsappMessages";
import { requireAdmin } from "@/lib/adminAuth";
import { SEAT_HOLDING_STATUSES } from "@/lib/availability";
import { addDays } from "@/lib/calendar";
import { formatDateLong } from "@/lib/format";
import { todayInStudio } from "@/lib/time";

const navBtn = "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";

export default async function AdminTodayPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  await connection();
  const { fecha } = await searchParams;
  const today = todayInStudio();
  const date = typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : today;
  const [day, review] = await Promise.all([getAdminDay(date), getReviewPieces()]);
  const t = es.admin.today;

  const active = day.slots.flatMap((s) => s.bookings).filter((b) => SEAT_HOLDING_STATUSES.includes(b.status));
  const people = active.reduce((sum, b) => sum + b.party_size, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold first-letter:uppercase">{formatDateLong(date)}</h1>
          <p className="text-sm text-muted">{t.totals(active.length, people)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin?fecha=${addDays(date, -1)}`} className={navBtn} aria-label={t.prevDay}>
            ‹
          </Link>
          {date !== today && (
            <Link href="/admin" className={navBtn}>
              {t.goToday}
            </Link>
          )}
          <Link href={`/admin?fecha=${addDays(date, 1)}`} className={navBtn} aria-label={t.nextDay}>
            ›
          </Link>
        </div>
      </div>

      {review.length > 0 && (
        <Link
          href="/admin/piezas#revisar"
          data-testid="review-banner"
          className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm"
        >
          <span>{es.admin.pieces.review.homeBanner(review.length)}</span>
          <span className="font-semibold text-accent underline">{es.admin.pieces.review.homeLink}</span>
        </Link>
      )}

      {day.blocked && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t.blocked(day.blocked.reason)}</p>}
      {day.slots.length === 0 && <p className="text-muted">{t.closed}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {day.slots.map((slot) => (
          <DaySlotCard
            key={slot.start}
            slot={slot}
            renderPhoneExtra={(b) =>
              day.noShows[b.id] ? (
                <span
                  data-testid="no-show-badge"
                  title={t.noShowTitle}
                  className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white"
                >
                  {t.noShowBadge(day.noShows[b.id])}
                </span>
              ) : null
            }
            renderActions={(b) => (
              <>
                {b.status === "confirmed" && <WhatsAppButton href={bookingWhatsappLink(b)} />}
                <BookingActions id={b.id} status={b.status} />
              </>
            )}
          />
        ))}
      </div>
    </div>
  );
}
