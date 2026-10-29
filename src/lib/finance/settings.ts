import { DEFAULT_SETTINGS, type FinanceSettings } from "./types";

export type FieldUnit = "mxn" | "percent" | "count" | "weeks" | "minutes" | "fx";

export type SettingField = {
  key: keyof FinanceSettings;
  column: string;
  unit: FieldUnit;
  integer?: boolean;
  /** Group heading in the settings form. */
  group: "taxes" | "costs" | "fixed" | "inventory" | "targets";
};

/** Every number the cortes and inventory math depends on. The admin edits all of them. */
export const SETTING_FIELDS: SettingField[] = [
  { key: "ivaRate", column: "iva_rate", unit: "percent", group: "taxes" },
  { key: "isrRate", column: "isr_rate", unit: "percent", group: "taxes" },
  { key: "resicoAnnualCap", column: "resico_annual_cap", unit: "mxn", group: "taxes" },
  { key: "cardFeeRate", column: "card_fee_rate", unit: "percent", group: "costs" },
  { key: "fxRate", column: "fx_rate", unit: "fx", group: "costs" },
  { key: "wasteRate", column: "waste_rate", unit: "percent", group: "costs" },
  { key: "suppliesPerPieceMxn", column: "supplies_per_piece_mxn", unit: "mxn", group: "costs" },
  { key: "fixedMonthlyMxn", column: "fixed_monthly_mxn", unit: "mxn", group: "fixed" },
  { key: "openDaysPerMonth", column: "open_days_per_month", unit: "count", integer: true, group: "fixed" },
  { key: "cashFloatMxn", column: "cash_float_mxn", unit: "mxn", group: "fixed" },
  { key: "cushionTargetMxn", column: "cushion_target_mxn", unit: "mxn", group: "fixed" },
  { key: "leadTimeWeeks", column: "lead_time_weeks", unit: "weeks", group: "inventory" },
  { key: "safetyWeeks", column: "safety_weeks", unit: "weeks", group: "inventory" },
  { key: "reviewWeeks", column: "review_weeks", unit: "weeks", group: "inventory" },
  { key: "planWeeklyCustomers", column: "plan_weekly_customers", unit: "count", integer: true, group: "inventory" },
  { key: "weeklyBreakeven", column: "weekly_breakeven", unit: "count", integer: true, group: "targets" },
  { key: "weeklyTarget", column: "weekly_target", unit: "count", integer: true, group: "targets" },
  { key: "monthlyBreakeven", column: "monthly_breakeven", unit: "count", integer: true, group: "targets" },
  { key: "kilnWeeklyMin", column: "kiln_weekly_min", unit: "count", integer: true, group: "targets" },
  { key: "kilnWeeklyMax", column: "kiln_weekly_max", unit: "count", integer: true, group: "targets" },
  { key: "slotGraceMinutes", column: "slot_grace_minutes", unit: "minutes", integer: true, group: "targets" },
];

/** Database row (snake_case, numerics may arrive as strings) → settings. Missing columns fall back to defaults. */
export function settingsFromRow(row: Record<string, unknown> | null | undefined): FinanceSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (!row) return out;
  for (const f of SETTING_FIELDS) {
    const n = Number(row[f.column]);
    if (row[f.column] !== null && row[f.column] !== undefined && Number.isFinite(n)) out[f.key] = n;
  }
  return out;
}

/** Settings → database columns. */
export function settingsToRow(s: FinanceSettings): Record<string, number> {
  return Object.fromEntries(SETTING_FIELDS.map((f) => [f.column, s[f.key]]));
}

/** Value shown in the form: rates are edited as percentages (4.176 means 4.176%). */
export function toFormValue(f: SettingField, s: FinanceSettings): string {
  const v = f.unit === "percent" ? s[f.key] * 100 : s[f.key];
  return String(Math.round(v * 1e6) / 1e6);
}

export type SettingsParse =
  | { ok: true; settings: FinanceSettings }
  | { ok: false; errors: Partial<Record<keyof FinanceSettings, "required" | "invalid">> };

/** Parses the form (strings by field key). Nothing is guessed: an empty or invalid field is an error. */
export function parseSettingsForm(values: Record<string, string>): SettingsParse {
  const settings = { ...DEFAULT_SETTINGS };
  const errors: Partial<Record<keyof FinanceSettings, "required" | "invalid">> = {};
  for (const f of SETTING_FIELDS) {
    const raw = (values[f.key] ?? "").trim().replace(",", ".");
    if (raw === "") {
      errors[f.key] = "required";
      continue;
    }
    const n = Number(raw);
    const value = f.unit === "percent" ? n / 100 : n;
    const tooBig = f.unit === "percent" && (n > 100 || n < 0);
    if (!Number.isFinite(n) || n < 0 || tooBig || (f.integer && !Number.isInteger(n)) || (f.key === "openDaysPerMonth" && n < 1) || (f.key === "fxRate" && n <= 0)) {
      errors[f.key] = "invalid";
      continue;
    }
    settings[f.key] = value;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, settings };
}
