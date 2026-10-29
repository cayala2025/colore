import Link from "next/link";
import { connection } from "next/server";
import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";
import { addDays } from "@/lib/calendar";
import { buildDayCut } from "@/lib/finance/dayCut";
import { loadDailyClose, loadSaleLites, loadSalesForDate, loadSettings } from "@/lib/finance/queries";
import { formatDateLong } from "@/lib/format";
import { toStudio, todayInStudio } from "@/lib/time";
import { DayCutClient, type DayView } from "./DayCutClient";
import { SalesList } from "./SalesList";

const navBtn = "flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-accent";

export default async function CortesPage({ searchParams }: PageProps<"/admin/cortes">) {
  await requireAdmin();
  await connection();
  const { fecha } = await searchParams;
  const today = todayInStudio();
  const date = typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : today;
  const t = es.finance.cuts;

  const [settings, sales, close, salesList] = await Promise.all([
    loadSettings(),
    loadSaleLites(date, date),
    loadDailyClose(date),
    loadSalesForDate(date),
  ]);

  // A closed day shows the frozen numbers; an open or reopened day shows live ones.
  let view: DayView;
  if (close?.closed) {
    view = {
      pieces: close.pieces, tickets: close.tickets, total: close.totalMxn, cash: close.cash, card: close.card, transfer: close.transfer,
      taxes: close.taxes, inventory: close.inventory, fixed: close.fixed, profit: close.profit, cardFee: close.cardFee,
      fixedShortfall: close.fixedShortfall, float: close.cashFloat, counted: close.cashCounted,
    };
  } else {
    const cut = buildDayCut(sales, settings, settings.cashFloatMxn, null);
    view = {
      pieces: cut.pieces, tickets: cut.tickets, total: cut.total, cash: cut.cash, card: cut.card, transfer: cut.transfer,
      taxes: cut.split.taxes, inventory: cut.split.inventory, fixed: cut.split.fixed, profit: cut.split.profit,
      cardFee: cut.split.cardFee, fixedShortfall: cut.split.fixedShortfall, float: cut.float, counted: close?.cashCounted ?? null,
    };
  }
  const fixedTarget = view.fixed + view.fixedShortfall;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm capitalize text-muted">{formatDateLong(date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/cortes?fecha=${addDays(date, -1)}`} className={navBtn} aria-label={t.prevDay}>‹</Link>
          {date !== today && <Link href="/admin/cortes" className={navBtn}>{t.goToday}</Link>}
          <Link href={`/admin/cortes?fecha=${addDays(date, 1)}`} className={navBtn} aria-label={t.nextDay}>›</Link>
          <Link href="/cobro" className={navBtn}>{t.openPos}</Link>
          <Link href="/admin/cortes/ajustes" className={navBtn}>{t.settings}</Link>
        </div>
      </div>

      <p className="text-sm text-muted">
        {close?.closed
          ? t.statusClosed(close.closedBy, toStudio(new Date(close.closedAt)).time)
          : close
            ? t.statusReopened
            : t.statusOpen}
      </p>

      <DayCutClient
        key={`${date}-${close?.closedAt ?? "open"}-${close?.reopenedAt ?? ""}`}
        date={date}
        view={view}
        fixedTarget={fixedTarget}
        closed={Boolean(close?.closed)}
        hasPriorClose={Boolean(close)}
        initialChecks={close?.checks ?? { counted: false, deposited: false, moved: false }}
        initialNotes={close?.notes ?? ""}
      />

      <SalesList sales={salesList} />
    </div>
  );
}
