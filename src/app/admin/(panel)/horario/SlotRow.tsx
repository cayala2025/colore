"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import type { SlotInput } from "@/lib/admin/slotInput";
import { createSlot, updateSlot, type SlotResult } from "./actions";

type Props =
  | { mode: "edit"; id: number; weekday: number; initial: SlotInput }
  | { mode: "create"; weekday: number; initial: SlotInput };

const field = "h-11 rounded-lg border border-line bg-bg px-2 text-sm";

export function SlotRow(props: Props) {
  const t = es.admin.schedule;
  const [values, setValues] = useState<SlotInput>(props.initial);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [pending, startTransition] = useTransition();
  const testId = props.mode === "edit" ? `slot-row-${props.weekday}-${props.initial.start}` : `slot-new-${props.weekday}`;

  function save() {
    startTransition(async () => {
      const r = props.mode === "edit" ? await updateSlot(props.id, values) : await createSlot(props.weekday, values);
      setResult(r);
    });
  }

  return (
    <div data-testid={testId} className="flex flex-wrap items-end gap-2 py-2">
      <label className="flex flex-col text-xs text-muted">
        {t.start}
        <input type="time" step={900} className={field} value={values.start} onChange={(e) => setValues({ ...values, start: e.target.value })} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {t.end}
        <input type="time" step={900} className={field} value={values.end} onChange={(e) => setValues({ ...values, end: e.target.value })} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {t.capacity}
        <input
          type="number"
          min={0}
          max={200}
          inputMode="numeric"
          className={`${field} w-20`}
          value={Number.isNaN(values.capacity) ? "" : values.capacity}
          onChange={(e) => setValues({ ...values, capacity: e.target.valueAsNumber })}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5 accent-accent" checked={values.active} onChange={(e) => setValues({ ...values, active: e.target.checked })} />
        {t.active}
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? t.saving : props.mode === "create" ? t.add : t.save}
      </button>
      {result?.ok && <span className="text-sm text-success">{t.saved}</span>}
      {result && !result.ok && (
        <span role="alert" className="text-sm text-danger">
          {t.errors[result.error]}
        </span>
      )}
    </div>
  );
}
