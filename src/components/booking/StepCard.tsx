import type { ReactNode } from "react";
import { es } from "@/content/es";

type Props = {
  id: string;
  label: string;
  title: string;
  locked: boolean;
  /** Short summary of the chosen value; shown next to the title once the step is done. */
  summary?: string;
  children: ReactNode;
};

export function StepCard({ id, label, title, locked, summary, children }: Props) {
  const headingId = `${id}-title`;
  return (
    <section
      aria-labelledby={headingId}
      data-testid={id}
      data-locked={locked}
      className={`rounded-card border border-line bg-surface p-4 transition-opacity ${
        locked ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
          {title}
        </h2>
        {summary && !locked && <span className="text-sm font-medium text-accent">{summary}</span>}
      </div>
      {locked ? (
        <p className="mt-2 text-sm text-muted">{es.booking.lockedHint}</p>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  );
}
