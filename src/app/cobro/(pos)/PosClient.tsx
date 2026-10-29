"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { formatMxn } from "@/lib/finance/format";
import { priceTicket } from "@/lib/finance/sale";
import type { PaymentMethod } from "@/lib/finance/types";
import { createSaleAction } from "./actions";

type PosProduct = { id: string; name: string; priceMxn: number; stock: number };
const METHODS: PaymentMethod[] = ["cash", "card", "transfer"];
const input = "h-11 w-full rounded-lg border border-line bg-bg px-3 text-base";

export function PosClient({ products, discountsEnabled, dayClosed }: { products: PosProduct[]; discountsEnabled: boolean; dayClosed: boolean }) {
  const t = es.finance.pos;
  const [qty, setQty] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discAmount, setDiscAmount] = useState("");
  const [discReason, setDiscReason] = useState("");
  const [discCode, setDiscCode] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const lines = Object.entries(qty).filter(([, n]) => n > 0).map(([productId, n]) => ({ productId, qty: n }));
  const discountAmount = discountOpen ? Number(discAmount.replace(",", ".")) || 0 : 0;
  const priced = priceTicket(lines, products.map((p) => ({ ...p, active: true })), discountOpen ? { amount: discountAmount, reason: discReason } : null);
  const subtotal = lines.reduce((sum, l) => sum + l.qty * (products.find((p) => p.id === l.productId)?.priceMxn ?? 0), 0);
  const total = Math.max(0, subtotal - discountAmount);
  const pieces = lines.reduce((n, l) => n + l.qty, 0);

  function add(id: string, delta: number) {
    setMessage(null);
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  }

  function reset() {
    setQty({});
    setReference("");
    setDiscountOpen(false);
    setDiscAmount("");
    setDiscReason("");
    setDiscCode("");
  }

  function submit() {
    startTransition(async () => {
      const r = await createSaleAction({
        lines,
        method,
        reference,
        discount: discountOpen && discountAmount > 0 ? { amount: discountAmount, reason: discReason, code: discCode } : null,
      });
      if (r.ok) {
        reset();
        setMessage({ kind: r.pieceNotFound ? "error" : "ok", text: r.pieceNotFound ? t.pieceNotFound : t.saved(formatMxn(r.total)) });
      } else {
        setMessage({ kind: "error", text: t.errors[r.error] });
      }
    });
  }

  const canSubmit = !dayClosed && !pending && pieces > 0 && (!discountOpen || discountAmount === 0 || (priced.ok && discCode.length > 0));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <section aria-label={t.products}>
        <h1 className="sr-only">{t.title}</h1>
        {dayClosed && <p role="alert" className="mb-3 rounded-card border border-danger p-3 text-sm text-danger">{t.dayClosed}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={dayClosed}
              onClick={() => add(p.id, 1)}
              className="relative flex min-h-28 flex-col items-start justify-between rounded-card border border-line bg-surface p-3 text-left active:bg-bg disabled:opacity-50"
            >
              {(qty[p.id] ?? 0) > 0 && (
                <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-sm font-semibold text-accent-ink">{qty[p.id]}</span>
              )}
              <span className="text-base font-semibold">{p.name}</span>
              <span>
                <span className="block text-lg">{formatMxn(p.priceMxn)}</span>
                <span className={`text-xs ${p.stock <= 10 ? "font-semibold text-danger" : "text-muted"}`}>{t.stockLeft(p.stock)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label={t.ticket} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 lg:sticky lg:top-4 lg:self-start">
        <h2 className="font-semibold">{t.ticket}</h2>
        {pieces === 0 ? (
          <p className="text-sm text-muted">{t.emptyTicket}</p>
        ) : (
          <ul className="divide-y divide-line">
            {lines.map((l) => {
              const p = products.find((x) => x.id === l.productId)!;
              return (
                <li key={l.productId} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-sm">{l.qty} × {p.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{formatMxn(l.qty * p.priceMxn)}</span>
                    <button type="button" aria-label={t.remove(p.name)} onClick={() => add(p.id, -1)} className="h-11 w-11 rounded-lg border border-line text-lg">−</button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <fieldset className="flex flex-col gap-1">
          <legend className="text-xs text-muted">{t.method}</legend>
          <div className="grid grid-cols-3 gap-1">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                onClick={() => setMethod(m)}
                className={`min-h-11 rounded-lg border text-sm font-medium ${method === m ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg"}`}
              >
                {t.methods[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.reference}
          <input className={input} value={reference} placeholder={t.referencePlaceholder} maxLength={120} onChange={(e) => setReference(e.target.value)} />
        </label>

        {discountOpen ? (
          <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              {t.discountAmount}
              <input className={input} inputMode="decimal" value={discAmount} onChange={(e) => setDiscAmount(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              {t.discountReason}
              <input className={input} value={discReason} maxLength={200} onChange={(e) => setDiscReason(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              {t.discountCode}
              <input className={input} type="password" autoComplete="off" value={discCode} onChange={(e) => setDiscCode(e.target.value)} />
            </label>
            <button type="button" className="min-h-11 text-sm font-medium text-muted underline" onClick={() => { setDiscountOpen(false); setDiscAmount(""); setDiscReason(""); setDiscCode(""); }}>
              {t.removeDiscount}
            </button>
          </div>
        ) : discountsEnabled ? (
          <button type="button" className="min-h-11 rounded-lg border border-line text-sm font-medium" onClick={() => setDiscountOpen(true)} disabled={pieces === 0}>
            {t.addDiscount}
          </button>
        ) : (
          <p className="text-xs text-muted">{t.discountsOff}</p>
        )}

        <dl className="flex flex-col gap-1 border-t border-line pt-2 text-sm">
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between"><dt>{t.subtotal}</dt><dd>{formatMxn(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>{t.discount}</dt><dd>−{formatMxn(discountAmount)}</dd></div>
            </>
          )}
          <div className="flex justify-between text-lg font-semibold"><dt>{t.total}</dt><dd>{formatMxn(total)}</dd></div>
        </dl>

        <button type="button" onClick={submit} disabled={!canSubmit} className="min-h-12 rounded-lg bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50">
          {pending ? t.submitting : t.submit(formatMxn(total))}
        </button>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>
        )}
      </section>
    </div>
  );
}
