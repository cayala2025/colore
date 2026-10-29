import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import type { SaleView } from "@/lib/finance/queries";

/** Read-only list of the day's tickets, voided ones included with who/when/why. */
export function SalesList({ sales }: { sales: SaleView[] }) {
  const t = es.finance.pos;
  const c = es.finance.cuts;
  return (
    <section className="rounded-card border border-line bg-surface p-4" aria-label={c.salesTitle}>
      <h2 className="font-semibold">{c.salesTitle}</h2>
      {sales.length === 0 && <p className="mt-2 text-sm text-muted">{c.noSales}</p>}
      <ul className="mt-2 divide-y divide-line">
        {sales.map((s) => (
          <li key={s.id} className={`flex flex-col gap-0.5 py-2 text-sm ${s.voided ? "opacity-70" : ""}`}>
            <p className="flex flex-wrap justify-between gap-2">
              <span>
                <span className="font-semibold">{s.time}</span> · {s.slotLabel} · {t.methods[s.paymentMethod]}
                {s.voided && <span className="ml-2 rounded bg-danger px-1.5 py-0.5 text-xs font-semibold text-white">{t.voided}</span>}
              </span>
              <span className={`font-semibold ${s.voided ? "line-through" : ""}`}>{formatMxn(s.total)}</span>
            </p>
            <p>{s.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</p>
            <p className="text-xs text-muted">
              {t.by(s.createdBy)}
              {s.reference && ` · ${s.reference}`}
            </p>
            {s.discount > 0 && <p className="text-xs text-muted">{t.discountLine(formatMxn(s.discount), s.discountReason ?? "")}</p>}
            {s.voided && <p className="text-xs text-danger">{t.voidedLine(s.voided.time, s.voided.reason, s.voided.by)}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
