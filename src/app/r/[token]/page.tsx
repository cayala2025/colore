import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { es } from "@/content/es";
import { formatDateLong, formatTimeRange } from "@/lib/format";
import { getBookingByToken } from "@/lib/manageBooking";
import { manageView } from "@/lib/manageRules";
import { ManageActions } from "./ManageActions";

export const metadata: Metadata = {
  title: `${es.manage.pageTitle} · ${es.brand.name}`,
  robots: { index: false, follow: false },
};

export default async function ManageBookingPage({ params, searchParams }: PageProps<"/r/[token]">) {
  const { token } = await params;
  const { accion } = await searchParams;
  const booking = await getBookingByToken(token);
  const t = es.manage;

  if (!booking) {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
          <div className="rounded-card border border-line bg-surface p-6 text-center">
            <h1 className="text-xl font-semibold">{t.notFoundTitle}</h1>
            <p className="mt-2 text-sm text-muted">{t.notFoundText}</p>
          </div>
        </main>
      </>
    );
  }

  const view = manageView(booking, new Date());
  const statusText = view.isPast && booking.status === "confirmed"
    ? t.status.past
    : booking.status === "confirmed" && booking.customer_confirmed_at
      ? t.status.customerConfirmed
      : t.status[booking.status];
  const intent = accion === "confirmar" || accion === "cancelar" ? accion : null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
        <section data-testid="manage-booking" className="rounded-card border border-line bg-surface p-6">
          <h1 className="text-2xl font-semibold">{t.hello(booking.name.split(" ")[0])}</h1>
          <p data-testid="manage-status" className="mt-1 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium">
            {statusText}
          </p>
          <dl className="mt-6 grid gap-3">
            <div className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">{es.booking.success.date}</dt>
              <dd className="font-medium first-letter:uppercase">{formatDateLong(booking.date)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">{es.booking.success.time}</dt>
              <dd className="font-medium">{formatTimeRange(booking.start_time, booking.end_time)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{es.booking.success.people}</dt>
              <dd className="font-medium">{booking.party_size}</dd>
            </div>
          </dl>
          <ManageActions token={token} canConfirm={view.canConfirm} canCancel={view.canCancel} intent={intent} />
          {booking.status === "cancelled" && (
            <>
              <p className="mt-6 text-sm text-muted">{t.cancelledText}</p>
              <Link
                href="/"
                className="mt-4 flex h-12 items-center justify-center rounded-xl border border-line font-medium hover:border-accent"
              >
                {t.bookAgain}
              </Link>
            </>
          )}
        </section>
      </main>
    </>
  );
}
