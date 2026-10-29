"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import type { ExpenseView } from "@/lib/finance/queries";
import { addExpenseAction, updateExpenseAction } from "./actions";

const t = es.finance.month;
const CATS = Object.keys(t.categories) as (keyof typeof t.categories)[];
const field = "h-11 w-full rounded-lg border border-line bg-bg px-3 text-base";
const primary = "min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60";

function ExpenseForm({ initial, submitLabel, onSubmit }: {
  initial: { spentOn: string; category: string; amount: string; note: string };
  submitLabel: string;
  onSubmit: (v: { spentOn: string; category: string; amountMxn: number; note: string }) => Promise<{ ok: boolean }>;
}) {
  const [v, setV] = useState(initial);
  const [state, setState] = useState<"ok" | "error" | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted">{t.form.date}<input type="date" className={field} value={v.spentOn} onChange={set("spentOn")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.form.category}
          <select className={field} value={v.category} onChange={set("category")}>{CATS.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.form.amount}<input inputMode="decimal" className={field} value={v.amount} onChange={set("amount")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.form.note}<input className={field} maxLength={200} value={v.note} onChange={set("note")} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className={primary}
          onClick={() =>
            start(async () => {
              const amountMxn = Number(v.amount.replace(",", "."));
              const r = v.amount.trim() === "" ? { ok: false } : await onSubmit({ spentOn: v.spentOn, category: v.category, amountMxn, note: v.note });
              setState(r.ok ? "ok" : "error");
              if (r.ok && submitLabel === t.form.add) setV({ ...v, amount: "", note: "" });
            })
          }
        >
          {submitLabel}
        </button>
        {state === "ok" && <span className="text-sm text-success">{t.form.saved}</span>}
        {state === "error" && <span role="alert" className="text-sm text-danger">{t.form.error}</span>}
      </div>
    </div>
  );
}

export function ExpensesSection({ month, defaultDate, expenses, total, fixedMonthly }: { month: string; defaultDate: string; expenses: ExpenseView[]; total: number; fixedMonthly: number }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4" aria-label={t.expensesTitle} data-month={month}>
      <h2 className="font-semibold">{t.expensesTitle}</h2>
      <p className="text-sm text-muted">{t.expensesVs(formatMxn(total), formatMxn(fixedMonthly))}</p>
      <div className="mt-3">
        <ExpenseForm initial={{ spentOn: defaultDate, category: "rent", amount: "", note: "" }} submitLabel={t.form.add} onSubmit={addExpenseAction} />
      </div>
      {expenses.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t.expensesEmpty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {expenses.map((e) => (
            <li key={e.id} className="py-3">
              <p className="mb-2 text-sm font-medium">{t.categories[e.category as keyof typeof t.categories] ?? e.category} · {formatMxn(e.amountMxn)}</p>
              <ExpenseForm
                initial={{ spentOn: e.spentOn, category: e.category, amount: String(e.amountMxn), note: e.note ?? "" }}
                submitLabel={t.form.save}
                onSubmit={(v) => updateExpenseAction(e.id, v)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
