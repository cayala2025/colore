"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { addBlockedDate, removeBlockedDate, type BlockResult } from "./actions";

const field = "mt-1 block h-11 w-full rounded-lg border border-line bg-bg px-2 text-sm";

export function BlockForm({ minDate }: { minDate: string }) {
  const t = es.admin.blocks;
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<BlockResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const r = await addBlockedDate(date, reason);
      setResult(r);
      if (r.ok) {
        setDate("");
        setReason("");
      }
    });
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <label className="text-sm font-medium">
          {t.date}
          <input type="date" min={minDate} className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="text-sm font-medium">
          {t.reason}
          <input className={field} placeholder={t.reasonPlaceholder} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !date}
          className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {pending ? t.adding : t.add}
        </button>
      </div>
      {result && !result.ok && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.errors[result.error]}
        </p>
      )}
      {result?.ok && result.bookings > 0 && (
        <p role="status" data-testid="block-warning" className="mt-2 rounded-lg bg-danger/10 p-2 text-sm text-danger">
          {t.hasBookings(result.bookings)}
        </p>
      )}
    </div>
  );
}

export function RemoveBlockButton({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await removeBlockedDate(date)))}
      className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium hover:border-danger hover:text-danger disabled:opacity-50"
    >
      {es.admin.blocks.remove}
    </button>
  );
}
