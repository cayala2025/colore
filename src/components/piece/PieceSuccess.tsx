import { es } from "@/content/es";
import { formatDateLong } from "@/lib/format";
import { PICKUP_DAYS } from "@/lib/pieceTimeline";

type Props = {
  code: string;
  readyDate: string;
  onReset: () => void;
};

export function PieceSuccess({ code, readyDate, onReset }: Props) {
  const t = es.piece.success;
  return (
    <section
      data-testid="piece-success"
      aria-live="polite"
      className="rounded-card border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-2xl font-semibold text-accent">{t.title}</h2>
      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-muted">{t.codeLabel}</p>
      <p
        data-testid="piece-code"
        className="my-2 font-mono text-7xl font-bold leading-none tracking-tight break-all sm:text-8xl"
      >
        {code}
      </p>
      <p className="mt-4 rounded-xl bg-accent-soft p-3 text-lg font-semibold">{t.showStaff}</p>
      <p className="mt-6 font-medium first-letter:uppercase">{t.readyBy(formatDateLong(readyDate))}</p>
      <p className="mt-2 text-sm text-muted">{t.emailNote}</p>
      <p className="mt-2 text-sm text-muted">{t.policy(PICKUP_DAYS)}</p>
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
