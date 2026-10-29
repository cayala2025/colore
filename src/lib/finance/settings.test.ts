import { describe, expect, it } from "vitest";
import { parseSettingsForm, settingsFromRow, settingsToRow, SETTING_FIELDS, toFormValue } from "./settings";
import { DEFAULT_SETTINGS as S } from "./types";

const formOf = (s = S) => Object.fromEntries(SETTING_FIELDS.map((f) => [f.key, toFormValue(f, s)]));

describe("settings form", () => {
  it("round-trips the defaults, showing rates as percentages", () => {
    const form = formOf();
    expect(form.cardFeeRate).toBe("4.176");
    expect(form.ivaRate).toBe("8");
    const r = parseSettingsForm(form);
    expect(r.ok && r.settings).toEqual(S);
  });

  it("lets the admin change the card fee", () => {
    const r = parseSettingsForm({ ...formOf(), cardFeeRate: "3,5" });
    expect(r.ok && r.settings.cardFeeRate).toBeCloseTo(0.035, 6);
  });

  it("rejects empty and invalid fields without guessing", () => {
    const r = parseSettingsForm({ ...formOf(), isrRate: "", openDaysPerMonth: "0", planWeeklyCustomers: "10.5", ivaRate: "-1" });
    expect(r).toEqual({ ok: false, errors: { isrRate: "required", openDaysPerMonth: "invalid", planWeeklyCustomers: "invalid", ivaRate: "invalid" } });
  });
});

describe("settings row mapping", () => {
  it("reads numerics that arrive as strings and falls back to defaults for missing columns", () => {
    const s = settingsFromRow({ card_fee_rate: "0.0300", fixed_monthly_mxn: "100000.00" });
    expect(s.cardFeeRate).toBe(0.03);
    expect(s.fixedMonthlyMxn).toBe(100000);
    expect(s.ivaRate).toBe(S.ivaRate);
  });
  it("writes every field", () => {
    expect(Object.keys(settingsToRow(S))).toHaveLength(SETTING_FIELDS.length);
  });
});
