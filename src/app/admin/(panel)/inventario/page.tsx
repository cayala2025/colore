import { connection } from "next/server";
import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";
import { formatMxn } from "@/lib/finance/format";
import { loadAdjustments, loadInventoryBalance, loadLatestCountDate, loadOnOrder, loadOrders, loadProducts, loadSettings, loadStockInputs } from "@/lib/finance/queries";
import { reorderSuggestion, stockByProduct, weeklyDemand } from "@/lib/finance/stock";
import { todayInStudio } from "@/lib/time";
import { BreakageForm, CountForm, OrderForm, OrdersList, ProductsEditor } from "./InventoryForms";

const STATUS_STYLE: Record<string, string> = {
  Bien: "bg-success/10 text-success",
  Pedir: "bg-accent/15 text-accent",
  Urgente: "bg-danger text-white",
  Temporada: "bg-line text-muted",
};

export default async function InventoryPage() {
  await requireAdmin();
  await connection();
  const t = es.finance.inventory;
  const [products, settings, inputs, onOrder, balance, orders, adjustments, latestCount] = await Promise.all([
    loadProducts(),
    loadSettings(),
    loadStockInputs(),
    loadOnOrder(),
    loadInventoryBalance(),
    loadOrders(),
    loadAdjustments(),
    loadLatestCountDate(),
  ]);
  const active = products.filter((p) => p.active);
  const ids = active.map((p) => p.id);
  const stock = stockByProduct(ids, inputs);
  const demand = weeklyDemand(
    ids,
    inputs.sold,
    inputs.count?.quantities ?? {},
    todayInStudio(),
    settings.planWeeklyCustomers,
    Object.fromEntries(active.map((p) => [p.id, p.weeklyDemandOverride])),
  );

  const rows = active.map((p) => {
    const d = demand[p.id];
    const r = reorderSuggestion(
      { stock: stock[p.id], onOrder: onOrder[p.id] ?? 0, demandPerWeek: d.perWeek, caseSize: p.caseSize, caseCostUsd: p.caseCostUsd, seasonal: p.seasonal },
      settings,
    );
    return { p, d, r, stock: stock[p.id], onOrder: onOrder[p.id] ?? 0 };
  });
  const suggestedUsd = rows.reduce((n, x) => n + x.r.costUsd, 0);
  const suggestedMxn = suggestedUsd * settings.fxRate;
  const missing = suggestedMxn - balance;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">{t.kpis.suggestedUsd}</dt>
          <dd className="text-lg font-semibold">US${suggestedUsd.toFixed(2)}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">{t.kpis.suggestedMxn}</dt>
          <dd className="text-lg font-semibold">{formatMxn(suggestedMxn)}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">{t.kpis.balance}</dt>
          <dd className="text-lg font-semibold">{formatMxn(balance)}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3">
          <dt className="text-xs text-muted">{t.kpis.enough}</dt>
          <dd className={`text-sm font-semibold ${suggestedUsd === 0 ? "" : missing > 0 ? "text-danger" : "text-success"}`}>
            {suggestedUsd === 0 ? t.kpis.none : missing > 0 ? t.kpis.no(formatMxn(missing)) : t.kpis.yes}
          </dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              {(["product", "stock", "onOrder", "demand", "cover", "min", "max", "status", "order", "usd"] as const).map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-medium">{t.columns[c]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ p, d, r, stock: s, onOrder: o }) => (
              <tr key={p.id}>
                <th scope="row" className="px-3 py-2 text-left font-medium">{p.name}</th>
                <td className={`px-3 py-2 ${s <= 10 ? "font-semibold text-danger" : ""}`}>{s}</td>
                <td className="px-3 py-2">{o}</td>
                <td className="px-3 py-2">
                  {d.perWeek.toFixed(1)}
                  <span className="block text-xs text-muted">{t.source[d.source]}</span>
                </td>
                <td className="px-3 py-2">{r.weeksOfCover === null ? t.noDemand : t.weeks(r.weeksOfCover)}</td>
                <td className="px-3 py-2">{Math.ceil(r.min)}</td>
                <td className="px-3 py-2">{Math.ceil(r.max)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{t.statuses[r.status]}</span>
                </td>
                <td className="px-3 py-2">{r.casesToOrder || ""}</td>
                <td className="px-3 py-2">{r.costUsd ? `US$${r.costUsd.toFixed(2)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">{t.explain}</p>

      <OrderForm
        key={rows.map((x) => x.r.casesToOrder).join("-")}
        products={active.map((p) => ({ id: p.id, name: p.name, caseSize: p.caseSize, caseCostUsd: p.caseCostUsd }))}
        suggested={Object.fromEntries(rows.map((x) => [x.p.id, x.r.casesToOrder]))}
        fxRate={settings.fxRate}
      />
      <OrdersList orders={orders} />
      <BreakageForm products={active.map((p) => ({ id: p.id, name: p.name, caseSize: p.caseSize, caseCostUsd: p.caseCostUsd }))} recent={adjustments} />
      <CountForm products={active.map((p) => ({ id: p.id, name: p.name, caseSize: p.caseSize, caseCostUsd: p.caseCostUsd }))} stock={stock} latest={latestCount} />
      <ProductsEditor products={products.map((p) => ({ id: p.id, name: p.name, priceMxn: p.priceMxn, costUsd: p.costUsd, caseSize: p.caseSize, caseCostUsd: p.caseCostUsd, active: p.active, weeklyDemandOverride: p.weeklyDemandOverride }))} />
    </div>
  );
}
