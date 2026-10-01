import { es } from "@/content/es";
import type { BookingStatus } from "@/lib/types";

const STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-accent-soft text-ink",
  attended: "bg-success/15 text-success",
  no_show: "bg-danger/10 text-danger",
  cancelled: "bg-line text-muted line-through",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {es.admin.bookingStatus[status]}
    </span>
  );
}
