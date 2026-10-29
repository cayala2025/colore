"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import { cashReconciliation } from "@/lib/finance/money";
import { closeDayAction, reopenDayAction, type CloseResult } from "./actions";

export type DayView = {
  pieces: number; tickets: number; total: number; cash: number; card: number; transfer: number;
  taxes: number; inventory: number; fixed: number; profit: number; cardFee: number; fixedShortfall: number;
  float: number; counted: number | null;
};

type Props = {
  date: string;
  view: DayView;
  fixedTarget: number;
  closed: boolean;
  hasPriorClose: boolean;
  initialChecks: { counted: boolean; deposited: boolean; moved: boolean };
  initialNotes: string;
};

const BUCKETS = ["taxes", "inventory", "fixed", "profit"] as const;

export function DayCutClient({ date, view, fixedTarget, closed, hasPriorClose, initialChecks, initialNotes }: Props) {
  const t = es.finance.cuts;
  const [counted, setCounted] = useState(view.counted === null ? "" : String(view.counted));
  const [checks, setChecks] = useState(initialChecks);
  const [notes, setNotes] = useState(initialNotes);
  const [result, setResult] = useState<CloseResult | null>(null);
  const [pending, startTransition] = useTransition();

  const countedNum = counted.trim() === "" ? null : Number(counted.replace(",", "."));
  const countedValid = countedNum === null || (Number.isFinite(countedNum) && countedNum >= 0);
  const rec = cashReconciliation(view.float, view.cash, countedValid ? countedNum : null);

  function run(fn: () => Promise<CloseResult>) {
    startTransition(async () => setResult(await fn()));
  }

  const kpis: [string, string][] = [
    [t.kpis.pieces, String(view.pieces)],
    [t.kpis.tickets, String(view.tickets)],
    [t.kpis.total, formatMxn(view.total)],
    [t.kpis.cash, formatMxn(view.cash)],
    [t.kpis.card, formatMxn(view.card)],
    [t.kpis.transfer, formatMxn(view.transfer)],
  ];
  const amounts: Record<(typeof BUCKETS)[number], number> = { taxes: view.taxes, inventory: view.inventory, fixed: view.fixed, profit: view.profit };

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-surface p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.cashTitle}>
        <h2 className="font-semibold">{t.cashTitle}</h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-3">
          <div><dt className="text-xs text-muted">{t.float}</dt><dd>{formatMxn(view.float)}</dd></div>
          <div><dt className="text-xs text-muted">{t.expected}</dt><dd className="font-semibold">{formatMxn(rec.expected)}</dd></div>
          <div>
            <dt className="text-xs text-muted"><label htmlFor="counted">{t.counted}</label></dt>
            <dd>
              <input
                id="counted"
                inputMode="decimal"
                disabled={closed}
                className="h-11 w-full rounded-lg border border-line bg-bg px-3 text-base disabled:opacity-70"
                value={counted}
                aria-invalid={!countedValid}
                onChange={(e) => setCounted(e.target.value)}
              />
            </dd>
          </div>
        </dl>
        {rec.diff === null ? (
          <p className="mt-2 text-sm text-muted">{t.countedHint}</p>
        ) : (
          <p className={`mt-2 text-sm font-semibold ${Math.abs(rec.diff) < 0.005 ? "text-success" : "text-danger"}`}>
            {t.diff}: {Math.abs(rec.diff) < 0.005 ? t.diffOk : rec.diff > 0 ? t.diffOver(formatMxn(rec.diff)) : t.diffShort(formatMxn(-rec.diff))}
          </p>
        )}
      </section>

      <section aria-label={t.bucketsTitle}>
        <h2 className="mb-2 font-semibold">{t.bucketsTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BUCKETS.map((b) => (
            <div key={b} className="rounded-card border border-line bg-surface p-3">
              <p className="text-sm text-muted">{t.buckets[b].title}</p>
              <p className="text-xl font-semibold">{formatMxn(amounts[b])}</p>
              <p className="mt-1 text-xs text-muted">{t.buckets[b].note}</p>
            </div>
          ))}
        </div>
        {view.cardFee > 0 && <p className="mt-2 text-sm text-muted">{t.cardFeeNote(formatMxn(view.cardFee))}</p>}
        {view.fixedShortfall > 0.004 && view.tickets > 0 && (
          <p className="mt-1 text-sm text-danger">{t.shortfallNote(formatMxn(view.fixedShortfall), formatMxn(fixedTarget))}</p>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.checklist}>
        <h2 className="font-semibold">{t.checklist}</h2>
        <div className="mt-1 flex flex-col">
          {(["counted", "deposited", "moved"] as const).map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-accent" disabled={closed} checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
              {t.checks[k]}
            </label>
          ))}
        </div>
        <label className="mt-2 flex flex-col gap-1 text-sm">
          {t.notes}
          <textarea className="min-h-20 rounded-lg border border-line bg-bg p-3 text-base disabled:opacity-70" disabled={closed} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {closed ? (
          <button type="button" disabled={pending} onClick={() => run(() => reopenDayAction(date))} className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold disabled:opacity-60">
            {pending ? t.working : t.reopen}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || !countedValid}
            onClick={() => run(() => closeDayAction({ date, counted: countedValid ? countedNum : null, checks, notes, seenTotal: view.total }))}
            className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {pending ? t.working : hasPriorClose ? t.update : t.close}
          </button>
        )}
        {result && !result.ok && (
          <span role="alert" className="text-sm text-danger">{t.errors[result.error]}</span>
        )}
      </div>
    </div>
  );
}
