import type { ReactNode } from "react";
import { es } from "@/content/es";
import type { AdminBooking, AdminSlot } from "@/lib/admin/daySlots";
import { formatTimeRange } from "@/lib/format";
import { BookingStatusBadge } from "./StatusBadge";

type Props = {
  slot: AdminSlot;
  /** Extra controls rendered for each booking (status buttons, WhatsApp…). */
  renderActions?: (booking: AdminBooking) => ReactNode;
  /** Extra info next to the phone (e.g. no-show badge). */
  renderPhoneExtra?: (booking: AdminBooking) => ReactNode;
};

export function DaySlotCard({ slot, renderActions, renderPhoneExtra }: Props) {
  const t = es.admin.today;
  const active = slot.bookings.filter((b) => b.status !== "cancelled");
  const cancelled = slot.bookings.filter((b) => b.status === "cancelled");
  const row = (b: AdminBooking) => (
    <li key={b.id} data-testid={`booking-${b.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium">
          {b.name} <span className="text-sm font-normal text-muted">· {t.people(b.party_size)}</span>
        </p>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <a href={`tel:${b.phone}`} className="underline-offset-2 hover:underline">
            {b.phone}
          </a>
          {renderPhoneExtra?.(b)}
          <BookingStatusBadge status={b.status} />
          {b.customer_confirmed_at && b.status === "confirmed" && (
            <span className="text-xs font-medium text-success">✓ {t.customerConfirmed}</span>
          )}
        </p>
      </div>
      {renderActions && <div className="flex flex-wrap gap-2">{renderActions(b)}</div>}
    </li>
  );
  const pct = slot.capacity ? Math.min(100, Math.round((slot.used / slot.capacity) * 100)) : 100;
  return (
    <section data-testid={`slot-${slot.start}`} className="rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {formatTimeRange(slot.start, slot.end)}
          {slot.offSchedule && <span className="ml-2 text-xs font-medium text-danger">{t.offSchedule}</span>}
        </h2>
        <p className="text-sm">
          <span className="font-semibold">{t.seats(slot.used, slot.capacity)}</span>
          <span className="text-muted"> · {t.free(slot.free)}</span>
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      {slot.bookings.length === 0 && <p className="mt-3 text-sm text-muted">{t.noBookings}</p>}
      {active.length > 0 && <ul className="mt-3 divide-y divide-line">{active.map(row)}</ul>}
      {cancelled.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center text-muted">{t.cancelledToggle(cancelled.length)}</summary>
          <ul className="divide-y divide-line">{cancelled.map(row)}</ul>
        </details>
      )}
    </section>
  );
}
