"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import { SETTING_FIELDS, type SettingField } from "@/lib/finance/settings";
import type { FinanceSettings } from "@/lib/finance/types";
import { saveSettings, type SettingsResult } from "./actions";

type Group = SettingField["group"];
const GROUPS: Group[] = ["taxes", "costs", "fixed", "inventory", "targets"];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const t = es.finance.settings;
  const [values, setValues] = useState(initial);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldErrors = result && !result.ok && result.error === "fields" ? result.fields : {};

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveSettings(values)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {GROUPS.map((group) => (
        <section key={group} className="rounded-card border border-line bg-surface p-4">
          <h2 className="font-semibold">{t.groups[group]}</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {SETTING_FIELDS.filter((f) => f.group === group).map((f) => {
              const copy = t.fields[f.key];
              const unit = t.units[f.unit];
              const err = fieldErrors[f.key];
              return (
                <label key={f.key} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{copy.label}</span>
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      className="h-11 w-full rounded-lg border border-line bg-bg px-3"
                      value={values[f.key] ?? ""}
                      aria-invalid={Boolean(err)}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                    {unit && <span className="shrink-0 text-xs text-muted">{unit}</span>}
                  </span>
                  {copy.hint && <span className="text-xs text-muted">{copy.hint}</span>}
                  {err && <span role="alert" className="text-xs text-danger">{t[err]}</span>}
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60">
          {pending ? t.saving : t.save}
        </button>
        {result?.ok && <span className="text-sm text-success">{t.saved}</span>}
        {result && !result.ok && (
          <span role="alert" className="text-sm text-danger">
            {result.error === "fields" ? t.fixErrors : t.error}
          </span>
        )}
      </div>
    </form>
  );
}
