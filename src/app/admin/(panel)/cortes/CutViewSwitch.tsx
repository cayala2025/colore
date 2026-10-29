import Link from "next/link";
import { es } from "@/content/es";

type Props = { view: "dia" | "semana" | "mes"; dayHref: string; weekHref: string; monthHref: string };

/** Día | Semana | Mes toggle (same pattern as the Calendario switch). */
export function CutViewSwitch({ view, dayHref, weekHref, monthHref }: Props) {
  const t = es.finance.cutViews;
  const item = (active: boolean) =>
    `flex min-h-11 items-center rounded-lg px-4 text-sm font-medium ${active ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"}`;
  const links: [Props["view"], string, string][] = [["dia", dayHref, t.day], ["semana", weekHref, t.week], ["mes", monthHref, t.month]];
  return (
    <nav aria-label={t.label} className="inline-flex w-fit gap-1 rounded-xl border border-line bg-surface p-1">
      {links.map(([v, href, label]) => (
        <Link key={v} href={href} aria-current={view === v ? "page" : undefined} className={item(view === v)}>{label}</Link>
      ))}
    </nav>
  );
}
