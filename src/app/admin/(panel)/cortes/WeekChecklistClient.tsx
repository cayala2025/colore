"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { closeWeekAction, type WeekChecklist } from "./actions";

const KEYS = ["closes", "paint", "glaze", "order", "profit"] as const;

export function WeekChecklistClient({ weekStart, initial, initialNotes, closedInfo }: { weekStart: string; initial: WeekChecklist; initialNotes: string; closedInfo: string | null }) {
  const t = es.finance.week;
  const [checks, setChecks] = useState(initial);
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<"saved" | "error" | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="rounded-card border border-line bg-surface p-4" aria-label={t.checklistTitle}>
      <h2 className="font-semibold">{t.checklistTitle}</h2>
      <div className="mt-1 flex flex-col">
        {KEYS.map((k) => (
          <label key={k} className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-accent" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
            {t.checklist[k]}
          </label>
        ))}
      </div>
      <label className="mt-2 flex flex-col gap-1 text-sm">
        {t.notes}
        <textarea className="min-h-20 rounded-lg border border-line bg-bg p-3 text-base" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          onClick={() => start(async () => setState((await closeWeekAction(weekStart, checks, notes)).ok ? "saved" : "error"))}
        >
          {closedInfo ? t.update : t.close}
        </button>
        {closedInfo && <span className="text-sm text-muted">{closedInfo}</span>}
        {state === "saved" && <span className="text-sm text-success">{t.saved}</span>}
        {state === "error" && <span role="alert" className="text-sm text-danger">{t.error}</span>}
      </div>
    </section>
  );
}
