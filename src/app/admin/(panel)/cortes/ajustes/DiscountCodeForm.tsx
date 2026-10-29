"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { saveDiscountCode } from "./discountActions";

export function DiscountCodeForm({ enabled }: { enabled: boolean }) {
  const t = es.finance.settings.discountCode;
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"saved" | "tooShort" | "generic" | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await saveDiscountCode(code);
      setResult(r.ok ? "saved" : r.error);
      if (r.ok) setCode("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
      <h2 className="font-semibold">{t.title}</h2>
      <p className="text-sm text-muted">{t.hint}</p>
      <p className="text-sm font-medium">{enabled || result === "saved" ? t.statusOn : t.statusOff}</p>
      <label className="flex flex-col gap-1 text-sm">
        {t.label}
        <input type="password" autoComplete="new-password" className="h-11 rounded-lg border border-line bg-bg px-3" value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60">{t.save}</button>
        {result === "saved" && <span className="text-sm text-success">{t.saved}</span>}
        {result === "tooShort" && <span role="alert" className="text-sm text-danger">{t.tooShort}</span>}
        {result === "generic" && <span role="alert" className="text-sm text-danger">{es.finance.settings.error}</span>}
      </div>
    </form>
  );
}
