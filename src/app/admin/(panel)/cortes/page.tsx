import { connection } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { monthOf } from "@/lib/calendar";
import { todayInStudio } from "@/lib/time";
import { DayCutView } from "./DayCutView";
import { MonthCutView } from "./MonthCutView";
import { WeekCutView } from "./WeekCutView";

// Día is the default; ?vista=semana&fecha=YYYY-MM-DD and ?vista=mes&mes=YYYY-MM show the other cuts.
export default async function CortesPage({ searchParams }: PageProps<"/admin/cortes">) {
  await requireAdmin();
  await connection();
  const { vista, fecha, mes } = await searchParams;
  const today = todayInStudio();
  const date = typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : today;
  if (vista === "semana") return <WeekCutView date={date} today={today} />;
  if (vista === "mes") {
    const month = typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : monthOf(today);
    return <MonthCutView month={month} today={today} />;
  }
  return <DayCutView date={date} today={today} />;
}
