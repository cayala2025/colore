import type { Product } from "./types";

export type ErrorKey = "empty" | "invalid" | "unknownProduct" | "missingCounts" | "reasonInvalid";

type Result<T> = ({ ok: true } & T) | { ok: false; error: ErrorKey };

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

export type OrderLine = { productId: string; cases: number };

/** Purchase order lines → pieces and USD cost per line. Lines with 0 cases are dropped. */
export function priceOrder(lines: OrderLine[], products: Pick<Product, "id" | "caseSize" | "caseCostUsd" | "active">[], fxRate: number) {
  const kept = lines.filter((l) => l.cases !== 0);
  if (kept.length === 0) return { ok: false, error: "empty" } as const;
  const out: { productId: string; cases: number; pieces: number; costUsd: number }[] = [];
  for (const l of kept) {
    if (!isInt(l.cases) || l.cases < 1 || l.cases > 1000) return { ok: false, error: "invalid" } as const;
    const p = products.find((x) => x.id === l.productId && x.active);
    if (!p) return { ok: false, error: "unknownProduct" } as const;
    out.push({ productId: p.id, cases: l.cases, pieces: l.cases * p.caseSize, costUsd: round2(l.cases * p.caseCostUsd) });
  }
  const totalUsd = round2(out.reduce((n, l) => n + l.costUsd, 0));
  return { ok: true, lines: out, totalUsd, totalMxn: round2(totalUsd * fxRate) } as const;
}

export const BREAKAGE_REASONS = ["broken", "lost", "other"] as const;
export type BreakageReason = (typeof BREAKAGE_REASONS)[number];

/** Breakage/loss is stored as a negative change to stock. */
export function parseBreakage(productId: string, qty: number, reason: string, products: Pick<Product, "id">[]): Result<{ quantity: number; reason: BreakageReason }> {
  if (!products.some((p) => p.id === productId)) return { ok: false, error: "unknownProduct" };
  if (!isInt(qty) || qty < 1 || qty > 1000) return { ok: false, error: "invalid" };
  if (!(BREAKAGE_REASONS as readonly string[]).includes(reason)) return { ok: false, error: "reasonInvalid" };
  return { ok: true, quantity: -qty, reason: reason as BreakageReason };
}

/** A physical count needs every active product (0 is a valid answer). */
export function parseCount(counts: Record<string, number | null>, products: Pick<Product, "id" | "active">[]): Result<{ items: { productId: string; quantity: number }[] }> {
  const active = products.filter((p) => p.active);
  const items: { productId: string; quantity: number }[] = [];
  for (const p of active) {
    const q = counts[p.id];
    if (q === null || q === undefined) return { ok: false, error: "missingCounts" };
    if (!isInt(q) || q < 0 || q > 100000) return { ok: false, error: "invalid" };
    items.push({ productId: p.id, quantity: q });
  }
  if (items.length === 0) return { ok: false, error: "empty" };
  return { ok: true, items };
}

export type ProductEdit = {
  id: string;
  priceMxn: number;
  costUsd: number;
  caseSize: number;
  caseCostUsd: number;
  active: boolean;
  /** null = computed from sales or the plan */
  weeklyDemandOverride: number | null;
};

export function parseProductEdit(e: ProductEdit): Result<{ edit: ProductEdit }> {
  const money = (n: number) => Number.isFinite(n) && n >= 0 && n < 1_000_000;
  if (!money(e.priceMxn) || !money(e.costUsd) || !money(e.caseCostUsd)) return { ok: false, error: "invalid" };
  if (!isInt(e.caseSize) || e.caseSize < 1 || e.caseSize > 1000) return { ok: false, error: "invalid" };
  if (e.weeklyDemandOverride !== null && (!Number.isFinite(e.weeklyDemandOverride) || e.weeklyDemandOverride < 0 || e.weeklyDemandOverride > 100000)) return { ok: false, error: "invalid" };
  return { ok: true, edit: e };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
