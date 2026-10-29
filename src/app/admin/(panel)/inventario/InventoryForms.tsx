"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import { priceOrder } from "@/lib/finance/inventoryInput";
import type { AdjustmentView, OrderView } from "@/lib/finance/queries";
import {
  cancelOrderAction, createOrderAction, receiveOrderAction, recordBreakageAction, saveCountAction, updateProductAction, createProductAction,
  type FormResult,
} from "./actions";

const f = es.finance.inventory.forms;
const box = "rounded-card border border-line bg-surface p-4";
const field = "h-11 w-full rounded-lg border border-line bg-bg px-3 text-base";
const primary = "min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60";

type Prod = { id: string; name: string; caseSize: number; caseCostUsd: number };

function useRun() {
  const [result, setResult] = useState<FormResult | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<FormResult>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) onOk?.();
    });
  return { result, pending, run };
}

function Status({ result }: { result: FormResult | null }) {
  if (!result) return null;
  return result.ok ? <span className="text-sm text-success">{f.saved}</span> : <span role="alert" className="text-sm text-danger">{f.errors[result.error]}</span>;
}

export function OrderForm({ products, suggested, fxRate }: { products: Prod[]; suggested: Record<string, number>; fxRate: number }) {
  const [cases, setCases] = useState<Record<string, string>>(() => Object.fromEntries(products.map((p) => [p.id, String(suggested[p.id] ?? 0)])));
  const [notes, setNotes] = useState("");
  const { result, pending, run } = useRun();
  const lines = products.map((p) => ({ productId: p.id, cases: Number(cases[p.id] || 0) }));
  const priced = priceOrder(lines, products.map((p) => ({ ...p, active: true })), fxRate);
  const usd = priced.ok ? priced.totalUsd : 0;

  return (
    <section className={box} aria-label={f.order.title}>
      <h2 className="font-semibold">{f.order.title}</h2>
      <p className="text-sm text-muted">{f.order.hint}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <label key={p.id} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{f.order.cases(p.name)}</span>
            <input inputMode="numeric" className={field} value={cases[p.id]} onChange={(e) => setCases({ ...cases, [p.id]: e.target.value })} />
            <span className="text-xs text-muted">{f.order.caseInfo(p.caseSize, `US$${p.caseCostUsd.toFixed(2)}`)}</span>
          </label>
        ))}
      </div>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        {f.order.notes}
        <input className={field} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <p className="mt-3 text-sm font-semibold">{f.order.total(`US$${usd.toFixed(2)}`, formatMxn(usd * fxRate), String(fxRate))}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className={primary} disabled={pending || !priced.ok} onClick={() => run(() => createOrderAction(lines, notes), () => setNotes(""))}>
          {pending ? f.saving : f.order.submit}
        </button>
        <Status result={result} />
      </div>
    </section>
  );
}

export function OrdersList({ orders }: { orders: OrderView[] }) {
  const o = f.orders;
  const { result, pending, run } = useRun();
  return (
    <section className={box} aria-label={o.title}>
      <h2 className="font-semibold">{o.title}</h2>
      {orders.length === 0 && <p className="mt-2 text-sm text-muted">{o.empty}</p>}
      <ul className="mt-2 divide-y divide-line">
        {orders.map((x) => (
          <li key={x.id} className={`flex flex-col gap-1 py-3 text-sm ${x.status === "cancelled" ? "opacity-60" : ""}`}>
            <p className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{o.header(x.orderedOn, `US$${x.totalUsd.toFixed(2)}`, formatMxn(x.totalMxn))}</span>
              <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold">{o.statuses[x.status]}</span>
            </p>
            <p>{x.lines.map((l) => o.line(l.cases, l.name, l.pieces)).join(" · ")}</p>
            <p className="text-xs text-muted">{o.by(x.createdBy)}{x.receivedOn && ` · ${o.received(x.receivedOn)}`}</p>
            {x.status === "ordered" && (
              <div className="flex gap-2">
                <button type="button" disabled={pending} className={primary} onClick={() => run(() => receiveOrderAction(x.id))}>{o.receive}</button>
                <button type="button" disabled={pending} className="min-h-11 rounded-lg border border-line px-4 text-sm disabled:opacity-60" onClick={() => run(() => cancelOrderAction(x.id))}>{o.cancel}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Status result={result} />
    </section>
  );
}

export function BreakageForm({ products, recent }: { products: Prod[]; recent: AdjustmentView[] }) {
  const b = f.breakage;
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("broken");
  const { result, pending, run } = useRun();
  return (
    <section className={box} aria-label={b.title}>
      <h2 className="font-semibold">{b.title}</h2>
      <p className="text-sm text-muted">{b.hint}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">{b.product}
          <select className={field} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">{b.qty}
          <input inputMode="numeric" className={field} value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">{b.reason}
          <select className={field} value={reason} onChange={(e) => setReason(e.target.value)}>
            {(["broken", "lost", "other"] as const).map((r) => <option key={r} value={r}>{b.reasons[r]}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className={primary} disabled={pending} onClick={() => run(() => recordBreakageAction(productId, Number(qty), reason), () => setQty("1"))}>
          {pending ? f.saving : b.submit}
        </button>
        <Status result={result} />
      </div>
      {recent.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted">{b.recent}</p>
          <ul className="text-sm">
            {recent.map((a) => (
              <li key={a.id}>{new Date(a.at).toLocaleDateString("es-MX", { timeZone: "America/Tijuana" })} · {a.quantity} {a.name} · {b.reasons[a.reason as keyof typeof b.reasons] ?? a.reason} · {a.by}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function CountForm({ products, stock, latest }: { products: Prod[]; stock: Record<string, number>; latest: string | null }) {
  const c = f.count;
  const [counts, setCounts] = useState<Record<string, string>>(() => Object.fromEntries(products.map((p) => [p.id, ""])));
  const [note, setNote] = useState("");
  const { result, pending, run } = useRun();
  const parsed = Object.fromEntries(products.map((p) => [p.id, counts[p.id].trim() === "" ? null : Number(counts[p.id])]));

  function submit() {
    if (!window.confirm(c.confirm)) return;
    run(() => saveCountAction(parsed, note), () => setCounts(Object.fromEntries(products.map((p) => [p.id, ""]))));
  }

  return (
    <section className={box} aria-label={c.title}>
      <h2 className="font-semibold">{c.title}</h2>
      <p className="text-sm text-muted">{c.hint}</p>
      {latest && <p className="text-xs text-muted">{c.latest(latest)}</p>}
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <label key={p.id} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{p.name} <span className="text-xs font-normal text-muted">({stock[p.id] ?? 0})</span></span>
            <input inputMode="numeric" className={field} value={counts[p.id]} onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value })} />
          </label>
        ))}
      </div>
      <label className="mt-3 flex flex-col gap-1 text-sm">{c.note}
        <input className={field} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className={primary} disabled={pending} onClick={submit}>{pending ? f.saving : c.submit}</button>
        <Status result={result} />
      </div>
    </section>
  );
}

export type EditableProduct = {
  id: string; name: string; priceMxn: number; costUsd: number; caseSize: number; caseCostUsd: number; active: boolean; weeklyDemandOverride: number | null;
};

function ProductRow({ p }: { p: EditableProduct }) {
  const t = f.products;
  const [v, setV] = useState({
    price: String(p.priceMxn), cost: String(p.costUsd), caseSize: String(p.caseSize), caseCost: String(p.caseCostUsd),
    demand: p.weeklyDemandOverride === null ? "" : String(p.weeklyDemandOverride), active: p.active,
  });
  const { result, pending, run } = useRun();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <li className="flex flex-col gap-2 py-3">
      <p className="font-medium">{p.name}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-muted">{t.price}<input inputMode="decimal" className={field} value={v.price} onChange={set("price")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.cost}<input inputMode="decimal" className={field} value={v.cost} onChange={set("cost")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.caseSize}<input inputMode="numeric" className={field} value={v.caseSize} onChange={set("caseSize")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.caseCost}<input inputMode="decimal" className={field} value={v.caseCost} onChange={set("caseCost")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.demand}<input inputMode="decimal" className={field} value={v.demand} placeholder={t.demandHint} onChange={set("demand")} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-accent" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
          {t.active}
        </label>
        <button
          type="button"
          className={primary}
          disabled={pending}
          onClick={() =>
            run(() =>
              updateProductAction({
                id: p.id,
                priceMxn: Number(v.price.replace(",", ".")),
                costUsd: Number(v.cost.replace(",", ".")),
                caseSize: Number(v.caseSize),
                caseCostUsd: Number(v.caseCost.replace(",", ".")),
                active: v.active,
                weeklyDemandOverride: v.demand.trim() === "" ? null : Number(v.demand.replace(",", ".")),
              }),
            )
          }
        >
          {pending ? f.saving : t.save}
        </button>
        <Status result={result} />
      </div>
    </li>
  );
}

export function ProductsEditor({ products }: { products: EditableProduct[] }) {
  return (
    <section className={box} aria-label={f.products.title}>
      <h2 className="font-semibold">{f.products.title}</h2>
      <p className="text-sm text-muted">{f.products.hint}</p>
      <p className="text-sm text-muted">{f.products.retireHint}</p>
      <ul className="mt-2 divide-y divide-line">{products.map((p) => <ProductRow key={p.id} p={p} />)}</ul>
      <NewProductForm />
    </section>
  );
}

function NewProductForm() {
  const t = f.products;
  const empty = { name: "", price: "", cost: "", caseSize: "", caseCost: "", demand: "", seasonal: false };
  const [v, setV] = useState(empty);
  const { result, pending, run } = useRun();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const num = (x: string) => (x.trim() === "" ? Number.NaN : Number(x.replace(",", ".")));
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
      <h3 className="font-semibold">{t.newTitle}</h3>
      <p className="text-sm text-muted">{t.newHint}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <label className="col-span-2 flex flex-col gap-1 text-xs text-muted sm:col-span-3 lg:col-span-1">{t.name}<input className={field} value={v.name} onChange={set("name")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.price}<input inputMode="decimal" className={field} value={v.price} onChange={set("price")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.cost}<input inputMode="decimal" className={field} value={v.cost} onChange={set("cost")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.caseSize}<input inputMode="numeric" className={field} value={v.caseSize} onChange={set("caseSize")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.caseCost}<input inputMode="decimal" className={field} value={v.caseCost} onChange={set("caseCost")} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">{t.demand}<input inputMode="decimal" className={field} value={v.demand} placeholder={t.demandHint} onChange={set("demand")} /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-accent" checked={v.seasonal} onChange={(e) => setV({ ...v, seasonal: e.target.checked })} />
          {t.seasonal}
        </label>
        <button
          type="button"
          className={primary}
          disabled={pending}
          onClick={() =>
            run(
              () =>
                createProductAction({
                  name: v.name,
                  priceMxn: num(v.price),
                  costUsd: num(v.cost),
                  caseSize: num(v.caseSize),
                  caseCostUsd: num(v.caseCost),
                  seasonal: v.seasonal,
                  weeklyDemandOverride: v.demand.trim() === "" ? null : num(v.demand),
                }),
              () => setV(empty),
            )
          }
        >
          {pending ? f.saving : t.add}
        </button>
        {result?.ok ? <span className="text-sm text-success">{t.added}</span> : <Status result={result} />}
      </div>
    </div>
  );
}
