import Link from "next/link";
import { es } from "@/content/es";
import { addDays } from "@/lib/calendar";
import { formatMxn } from "@/lib/finance/format";
import { loadClosedDates, loadSaleLites, loadSettings, loadWeeklyClose } from "@/lib/finance/queries";
import { heatmap, SLOT_LABELS, weekRange } from "@/lib/finance/slots";
import { summarizeWeek } from "@/lib/finance/summaries";
import { formatDateLong } from "@/lib/format";
import { toStudio } from "@/lib/time";
import { CutViewSwitch } from "./CutViewSwitch";
import { WeekChecklistClient } from "./WeekChecklistClient";

const navBtn = "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";
const DAY = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const CHIP = { below: "bg-danger/10 text-danger", breakeven: "bg-accent/15 text-accent", target: "bg-success/10 text-success" } as const;
const KILN_CHIP = { ok: "bg-success/10 text-success", tight: "bg-accent/15 text-accent", risk: "bg-danger text-white" } as const;

export async function WeekCutView({ date, today }: { date: string; today: string }) {
  const t = es.finance.week;
  const range = weekRange(date);
  const [settings, sales, closedDates, weekly] = await Promise.all([
    loadSettings(),
    loadSaleLites(range.start, range.end),
    loadClosedDates(range.start, range.end),
    loadWeeklyClose(range.start),
  ]);
  const w = summarizeWeek(sales, range.days, closedDates, settings);
  const live = sales.filter((s) => !s.voided);
  const map = heatmap(range.days, live.map((s) => ({ studioDate: s.studioDate, slotLabel: s.slotLabel, pieces: s.items.length })));
  const maxDay = Math.max(1, w.dailyBreakeven, ...w.perDay.map((d) => d.pieces));
  const thisWeek = weekRange(today).start;

  return (
    <div className="flex flex-col gap-4">
      <CutViewSwitch view="semana" dayHref={`/admin/cortes?fecha=${date}`} weekHref="/admin/cortes?vista=semana" monthHref={`/admin/cortes?vista=mes&mes=${date.slice(0, 7)}`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted">{t.range(formatDateLong(range.start), formatDateLong(range.end))}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/cortes?vista=semana&fecha=${addDays(range.start, -7)}`} className={navBtn} aria-label={es.finance.cutViews.prevWeek}>‹</Link>
          {range.start !== thisWeek && <Link href="/admin/cortes?vista=semana" className={navBtn}>{es.finance.cutViews.thisWeek}</Link>}
          <Link href={`/admin/cortes?vista=semana&fecha=${addDays(range.start, 7)}`} className={navBtn} aria-label={es.finance.cutViews.nextWeek}>›</Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {([
          [t.kpis.customers, String(w.pieces)],
          [t.kpis.tickets, String(w.tickets)],
          [t.kpis.total, formatMxn(w.total)],
          [t.kpis.breakeven, String(settings.weeklyBreakeven)],
          [t.kpis.target, String(settings.weeklyTarget)],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-surface p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${CHIP[w.status]}`}>{t.status[w.status]}</span>
        <span className="text-muted">{t.customersNote}</span>
      </p>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.perDayTitle}>
        <h2 className="font-semibold">{t.perDayTitle}</h2>
        <div className="relative mt-3 flex h-40 items-end gap-2">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent" style={{ bottom: `${(w.dailyBreakeven / maxDay) * 100}%` }} aria-hidden />
          {w.perDay.map((d, i) => (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold">{d.pieces}</span>
              <div className="w-full rounded-t bg-accent" style={{ height: `${(d.pieces / maxDay) * 100}%`, minHeight: d.pieces ? 2 : 0 }} />
              <span className="text-xs text-muted">{DAY[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{t.breakevenLine(w.dailyBreakeven.toFixed(1))}</p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.heatmapTitle}>
        <h2 className="font-semibold">{t.heatmapTitle}</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-center text-sm">
            <thead className="text-xs text-muted">
              <tr><th scope="col" className="p-1" />{SLOT_LABELS.map((l) => <th key={l} scope="col" className="p-1 font-medium">{l}</th>)}</tr>
            </thead>
            <tbody>
              {map.cells.map((row, i) => (
                <tr key={range.days[i]}>
                  <th scope="row" className="p-1 text-left text-xs font-medium text-muted">{DAY[i]}</th>
                  {row.map((c) => (
                    <td key={c.label} className="p-1">
                      <div
                        title={c.closed ? t.heatmapClosed : undefined}
                        className={`flex h-10 items-center justify-center rounded ${c.closed ? "bg-line/60 text-muted" : "bg-accent text-accent-ink"}`}
                        style={c.closed ? undefined : { opacity: c.pieces === 0 ? 0.12 : 0.25 + 0.75 * (c.pieces / Math.max(1, map.max)) }}
                      >
                        {c.closed ? "" : c.pieces}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label={t.bucketsTitle}>
        <h2 className="mb-2 font-semibold">{t.bucketsTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {([["taxes", w.split.taxes], ["inventory", w.split.inventory], ["fixed", w.split.fixed], ["profit", w.split.profit]] as const).map(([k, v]) => (
            <div key={k} className="rounded-card border border-line bg-surface p-3">
              <p className="text-sm text-muted">{es.finance.cuts.buckets[k].title}</p>
              <p className="text-xl font-semibold">{formatMxn(v)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.kilnTitle}>
        <h2 className="font-semibold">{t.kilnTitle}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${KILN_CHIP[w.kiln]}`}>{t.kiln[w.kiln]}</span>
          {t.kilnLine(w.pieces, settings.kilnWeeklyMin, settings.kilnWeeklyMax)}
        </p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4" aria-label={t.unclosedTitle}>
        <h2 className="font-semibold">{t.unclosedTitle}</h2>
        {w.unclosedDays.length === 0 ? (
          <p className="mt-1 text-sm text-muted">{t.unclosedNone}</p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-2">
            {w.unclosedDays.map((d) => (
              <li key={d}><Link href={`/admin/cortes?fecha=${d}`} className={`${navBtn} capitalize`}>{formatDateLong(d)}</Link></li>
            ))}
          </ul>
        )}
      </section>

      <WeekChecklistClient
        key={`${range.start}-${weekly?.closedAt ?? "open"}`}
        weekStart={range.start}
        initial={{ closes: false, paint: false, glaze: false, order: false, profit: false, ...weekly?.checklist }}
        initialNotes={weekly?.notes ?? ""}
        closedInfo={weekly ? t.closedBy(weekly.closedBy, toStudio(new Date(weekly.closedAt)).date) : null}
      />
    </div>
  );
}
