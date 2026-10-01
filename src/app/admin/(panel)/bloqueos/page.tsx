import { connection } from "next/server";
import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";
import { formatDateLong } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayInStudio } from "@/lib/time";
import { BlockForm, RemoveBlockButton } from "./BlockForm";

export default async function AdminBlocksPage() {
  await requireAdmin();
  await connection();
  const today = todayInStudio();
  const { data, error } = await supabaseAdmin()
    .from("blocked_dates")
    .select("date, reason")
    .gte("date", today)
    .order("date");
  if (error) throw new Error(error.message);
  const t = es.admin.blocks;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>
      <BlockForm minDate={today} />
      {(data ?? []).length === 0 ? (
        <p className="text-muted">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {(data ?? []).map((b) => (
            <li key={b.date} data-testid={`block-${b.date}`} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium first-letter:uppercase">{formatDateLong(b.date)}</p>
                {b.reason && <p className="text-sm text-muted">{b.reason}</p>}
              </div>
              <RemoveBlockButton date={b.date} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
