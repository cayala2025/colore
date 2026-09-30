import { es } from "@/content/es";
import { formatDateLong, formatTimeRange } from "@/lib/format";

type Props = {
  date: string;
  start: string;
  end: string;
  party: number;
  onReset: () => void;
};

export function SuccessScreen({ date, start, end, party, onReset }: Props) {
  const t = es.booking.success;
  return (
    <section
      data-testid="booking-success"
      aria-live="polite"
      className="rounded-card border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-4xl font-semibold text-accent">{t.title}</h2>
      <p className="mt-1 text-muted">{t.subtitle}</p>
      <dl className="mt-6 grid gap-3 text-left">
        <div className="flex justify-between gap-4 border-b border-line pb-2">
          <dt className="text-muted">{t.date}</dt>
          <dd className="font-medium first-letter:uppercase">{formatDateLong(date)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line pb-2">
          <dt className="text-muted">{t.time}</dt>
          <dd className="font-medium">{formatTimeRange(start, end)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.people}</dt>
          <dd className="font-medium">{party}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-muted">{t.emailNote}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 h-12 w-full rounded-xl border border-line font-medium hover:border-accent"
      >
        {t.another}
      </button>
    </section>
  );
}
