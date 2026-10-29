import Link from "next/link";
import { es } from "@/content/es";
import { addMonths } from "@/lib/calendar";
import { formatMxn } from "@/lib/finance/format";
import { loadCushionSaved, loadExpenses, loadSaleLites, loadSettings } from "@/lib/finance/queries";
import { monthBounds, summarizeMonth } from "@/lib/finance/summaries";
import { CutViewSwitch } from "./CutViewSwitch";
import { ExpensesSection } from "./ExpensesSection";

const navBtn = "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export async function MonthCutView({ month, today }: { month: string; today: string }) {
  const t = es.finance.month;
  const b = monthBounds(month);
  const [settings, ytd, expenses, cushion] = await Promise.all([
    loadSettings(),
    loadSaleLites(b.yearStart, b.last),
    loadExpenses(b.first, b.last),
    loadCushionSaved(),
  ]);
  const monthSales = ytd.filter((s) => s.studioDate >= b.first);
  const m = summarizeMonth(monthSales, ytd, expenses.map((e) => e.amountMxn), settings);
  const [y, mm] = month.split("-").map(Number);
  const capPct = Math.min(100, m.capUsedPct);
  const cushionPct = Math.min(100, (cushion / settings.cushionTargetMxn) * 100);
  const pct = (n: number) => n.toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      <CutViewSwitch view="mes" dayHref={`/admin/cortes?fecha=${month === today.slice(0, 7) ? today : b.first}`} weekHref={`/admin/cortes?vista=semana&fecha=${month === today.slice(0, 7) ? today : b.first}`} monthHref="/admin/cortes?vista=mes" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold capitalize">{t.title}: {MONTHS[mm - 1]} {y}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/cortes?vista=mes&mes=${addMonths(month, -1)}`} className={navBtn} aria-label={es.finance.cutViews.prevMonth}>‹</Link>
          {month !== today.slice(0, 7) && <Link href="/admin/cortes?vista=mes" className={navBtn}>{es.finance.cutViews.thisMonth}</Link>}
          <Link href={`/admin/cortes?vista=mes&mes=${addMonths(month, 1)}`} className={navBtn} aria-label={es.finance.cutViews.nextMonth}>›</Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {([[t.kpis.customers, String(m.pieces)], [t.kpis.tickets, String(m.tickets)], [t.kpis.total, formatMxn(m.total)], [t.kpis.breakeven, String(settings.monthlyBreakeven)]] as const).map(([l, v]) => (
          <div key={l} className="rounded-card border border-line bg-surface p-3"><dt className="text-xs text-muted">{l}</dt><dd className="text-lg font-semibold">{v}</dd></div>
        ))}
      </dl>
      <p className={`text-sm font-medium ${m.customersVsBreakeven >= 0 ? "text-success" : "text-danger"}`}>{t.customersVs(m.customersVsBreakeven)}</p>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.taxesTitle}>
        <h2 className="font-semibold">{t.taxesTitle}</h2>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          <div><dt className="text-xs text-muted">{t.iva}</dt><dd className="text-xl font-semibold">{formatMxn(m.iva)}</dd><dd className="text-xs text-muted">{t.ivaNote}</dd></div>
          <div>
            <dt className="text-xs text-muted">{t.isr}</dt>
            {m.resico.exceedsCap ? (
              <dd role="alert" className="text-sm font-semibold text-danger">{t.resicoExceeded}</dd>
            ) : (
              <>
                <dd className="text-xl font-semibold">{formatMxn(m.resico.isr)}</dd>
                <dd className="text-xs text-muted">{t.isrDetail(formatMxn(m.incomeNoIva), `${(m.resico.rate * 100).toFixed(2)}%`)}</dd>
                {m.resico.aboveTable && <dd className="text-xs text-danger">{t.isrAboveTable}</dd>}
              </>
            )}
          </div>
        </dl>
        <h3 className="mt-4 text-sm font-medium">{t.capTitle}</h3>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(capPct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full ${m.capWarning ? "bg-danger" : "bg-accent"}`} style={{ width: `${capPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{t.capLine(formatMxn(m.ytdIncomeNoIva), formatMxn(settings.resicoAnnualCap), pct(m.capUsedPct))}</p>
        {m.capWarning && <p role="alert" className="text-sm font-semibold text-danger">{t.capWarning}</p>}
      </section>

      <section aria-label={t.bucketsTitle}>
        <h2 className="mb-2 font-semibold">{t.bucketsTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {([["taxes", m.split.taxes], ["inventory", m.split.inventory], ["fixed", m.split.fixed], ["profit", m.split.profit]] as const).map(([k, v]) => (
            <div key={k} className="rounded-card border border-line bg-surface p-3"><p className="text-sm text-muted">{es.finance.cuts.buckets[k].title}</p><p className="text-xl font-semibold">{formatMxn(v)}</p></div>
          ))}
        </div>
      </section>

      <ExpensesSection month={month} defaultDate={month === today.slice(0, 7) ? today : b.first} expenses={expenses} total={m.expenses} fixedMonthly={settings.fixedMonthlyMxn} />

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.profitTitle}>
        <h2 className="font-semibold">{t.profitTitle}</h2>
        <p className={`text-2xl font-semibold ${m.profit < 0 ? "text-danger" : ""}`}>{formatMxn(m.profit)}</p>
        <p className="text-xs text-muted">{t.profitFormula}</p>
        <h3 className="mt-4 text-sm font-medium">{t.cushionTitle}</h3>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(cushionPct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-success" style={{ width: `${cushionPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{t.cushionLine(formatMxn(cushion), formatMxn(settings.cushionTargetMxn), pct((cushion / settings.cushionTargetMxn) * 100))}</p>
      </section>
    </div>
  );
}
