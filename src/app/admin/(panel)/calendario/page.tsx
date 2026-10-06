import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { monthOf } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";

// Week view is the default; ?vista=mes&mes=YYYY-MM shows the month (past and future months allowed).
export default async function AdminCalendarPage({ searchParams }: PageProps<"/admin/calendario">) {
  await requireAdmin();
  await connection();
  const { vista, semana, mes } = await searchParams;
  const today = todayInStudio();

  if (vista === "mes") {
    const month = typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : monthOf(today);
    return <MonthView month={month} today={today} />;
  }
  const base = typeof semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? semana : today;
  return <WeekView base={base} today={today} />;
}
