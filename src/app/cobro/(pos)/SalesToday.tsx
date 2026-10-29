"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import type { SaleView } from "@/lib/finance/queries";
import { voidSaleAction } from "./actions";

export function SalesToday({ sales, dayClosed }: { sales: SaleView[]; dayClosed: boolean }) {
  const t = es.finance.pos;
  const [voiding, setVoiding] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const live = sales.filter((s) => !s.voided);

  function confirmVoid(id: string) {
    startTransition(async () => {
      const r = await voidSaleAction(id, reason);
      if (r.ok) {
        setVoiding(null);
        setReason("");
        setError(null);
      } else {
        setError(t.errors[r.error]);
      }
    });
  }

  return (
    <section aria-label={t.todayTitle} className="rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{t.todayTitle}</h2>
        <p className="text-sm text-muted">{t.todayTotal(formatMxn(live.reduce((n, s) => n + s.total, 0)), live.length)}</p>
      </div>
      {sales.length === 0 && <p className="mt-2 text-sm text-muted">{t.todayEmpty}</p>}
      <ul className="mt-2 divide-y divide-line">
        {sales.map((s) => (
          <li key={s.id} className={`flex flex-col gap-1 py-3 ${s.voided ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-semibold">{s.time}</span> · {s.slotLabel} · {t.methods[s.paymentMethod]}
                {s.voided && <span className="ml-2 rounded bg-danger px-1.5 py-0.5 text-xs font-semibold text-white">{t.voided}</span>}
              </p>
              <p className={`font-semibold ${s.voided ? "line-through" : ""}`}>{formatMxn(s.total)}</p>
            </div>
            <p className="text-sm">{s.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</p>
            <p className="text-xs text-muted">
              {t.by(s.createdBy)}
              {s.reference && ` · ${s.reference}`}
            </p>
            {s.discount > 0 && <p className="text-xs text-muted">{t.discountLine(formatMxn(s.discount), s.discountReason ?? "")}</p>}
            {s.voided && <p className="text-xs text-danger">{t.voidedLine(s.voided.time, s.voided.reason, s.voided.by)}</p>}
            {!s.voided && !dayClosed && voiding !== s.id && (
              <button type="button" onClick={() => { setVoiding(s.id); setReason(""); setError(null); }} className="min-h-11 self-start text-sm font-medium text-danger underline">
                {t.void}
              </button>
            )}
            {voiding === s.id && (
              <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
                <p className="text-sm font-semibold">{t.voidTitle}</p>
                <p className="text-xs text-muted">{t.voidHint}</p>
                <label className="flex flex-col gap-1 text-xs text-muted">
                  {t.voidReason}
                  <input className="h-11 rounded-lg border border-line bg-bg px-3 text-base" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
                </label>
                {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={pending || !reason.trim()} onClick={() => confirmVoid(s.id)} className="min-h-11 rounded-lg bg-danger px-4 text-sm font-semibold text-white disabled:opacity-50">
                    {t.voidConfirm}
                  </button>
                  <button type="button" onClick={() => setVoiding(null)} className="min-h-11 rounded-lg border border-line px-4 text-sm">{t.voidCancel}</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
