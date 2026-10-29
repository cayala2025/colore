import { requireAdmin } from "@/lib/adminAuth";
import { loadDiscountHash, loadProducts, loadSalesForDate, loadStock } from "@/lib/finance/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayInStudio } from "@/lib/time";
import { PosClient } from "./PosClient";
import { SalesToday } from "./SalesToday";

export default async function CobroPage() {
  await requireAdmin();
  const date = todayInStudio();
  const [products, sales, hash, close] = await Promise.all([
    loadProducts(),
    loadSalesForDate(date),
    loadDiscountHash(),
    supabaseAdmin().from("daily_closes").select("studio_date").eq("studio_date", date).is("reopened_at", null).maybeSingle(),
  ]);
  const stock = await loadStock(products);
  const dayClosed = Boolean(close.data);
  const shown = products.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, priceMxn: p.priceMxn, stock: stock[p.id] ?? 0 }));

  return (
    <div className="flex flex-col gap-6">
      <PosClient products={shown} discountsEnabled={Boolean(hash)} dayClosed={dayClosed} />
      <SalesToday sales={sales} dayClosed={dayClosed} />
    </div>
  );
}
