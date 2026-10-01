import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SlotRow } from "./SlotRow";

type Row = { id: number; weekday: number; start_time: string; end_time: string; capacity: number; active: boolean };

export default async function AdminSchedulePage() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("schedule_slots")
    .select("id, weekday, start_time, end_time, capacity, active")
    .order("weekday")
    .order("start_time");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  const t = es.admin.schedule;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>
      {es.booking.date.weekdaysLong.map((dayName, i) => {
        const weekday = i + 1;
        const daySlots = rows.filter((r) => r.weekday === weekday);
        return (
          <section key={weekday} data-testid={`weekday-${weekday}`} className="rounded-card border border-line bg-surface p-4">
            <h2 className="font-semibold capitalize">{dayName}</h2>
            {!daySlots.some((s) => s.active) && <p className="text-sm text-muted">{t.closedDay}</p>}
            <div className="divide-y divide-line">
              {daySlots.map((s) => (
                <SlotRow
                  key={s.id}
                  mode="edit"
                  id={s.id}
                  weekday={weekday}
                  initial={{ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), capacity: s.capacity, active: s.active }}
                />
              ))}
              <SlotRow mode="create" weekday={weekday} initial={{ start: "", end: "", capacity: 30, active: true }} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
