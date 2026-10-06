import Link from "next/link";
import { es } from "@/content/es";

type Props = { view: "semana" | "mes"; weekHref: string; monthHref: string };

/** Semana | Mes toggle. */
export function ViewSwitch({ view, weekHref, monthHref }: Props) {
  const t = es.admin.calendar;
  const item = (active: boolean) =>
    `flex min-h-11 items-center rounded-lg px-4 text-sm font-medium ${active ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`;
  return (
    <nav aria-label={t.viewLabel} className="inline-flex w-fit gap-1 rounded-xl border border-line bg-surface p-1">
      <Link href={weekHref} aria-current={view === "semana" ? "page" : undefined} className={item(view === "semana")}>
        {t.week}
      </Link>
      <Link href={monthHref} aria-current={view === "mes" ? "page" : undefined} className={item(view === "mes")}>
        {t.month}
      </Link>
    </nav>
  );
}
