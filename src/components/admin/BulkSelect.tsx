"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { applyPieceAction } from "@/app/admin/(panel)/piezas/actions";
import { es } from "@/content/es";

type Ctx = { selected: Set<string>; toggle: (id: string) => void; setMany: (ids: string[], on: boolean) => void; clear: () => void };
const BulkContext = createContext<Ctx | null>(null);

function useBulk() {
  const ctx = useContext(BulkContext);
  if (!ctx) throw new Error("BulkSelect components must be inside <BulkProvider>");
  return ctx;
}

/** Holds the board's selection and renders the sticky "Marcar lista" bar. */
export function BulkProvider({ children }: { children: ReactNode }) {
  const t = es.admin.pieces.bulk;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  const ctx: Ctx = {
    selected,
    toggle: (id) =>
      setSelected((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setMany: (ids, on) =>
      setSelected((s) => {
        const next = new Set(s);
        for (const id of ids) {
          if (on) next.add(id);
          else next.delete(id);
        }
        return next;
      }),
    clear: () => setSelected(new Set()),
  };

  function markReady() {
    startTransition(async () => {
      const { changed } = await applyPieceAction([...selected], "ready");
      setDone(changed);
      setSelected(new Set());
    });
  }

  return (
    <BulkContext.Provider value={ctx}>
      {children}
      {done !== null && selected.size === 0 && (
        <p role="status" data-testid="bulk-done" className="text-sm font-medium text-success">
          {t.done(done)}
        </p>
      )}
      {selected.size > 0 && (
        <div
          data-testid="bulk-bar"
          className="sticky bottom-4 z-10 mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-surface p-3 shadow-lg"
        >
          <span className="text-sm font-medium">{t.selected(selected.size)}</span>
          <div className="flex gap-2">
            <button type="button" onClick={ctx.clear} className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium">
              {t.clear}
            </button>
            <button
              type="button"
              onClick={markReady}
              disabled={pending}
              className="min-h-11 rounded-lg bg-success px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t.markReady}
            </button>
          </div>
        </div>
      )}
    </BulkContext.Provider>
  );
}

export function BulkCheckbox({ id, code }: { id: string; code: string }) {
  const { selected, toggle } = useBulk();
  return (
    <label className="-m-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        aria-label={es.admin.pieces.bulk.select(code)}
        className="h-5 w-5 accent-accent"
        checked={selected.has(id)}
        onChange={() => toggle(id)}
      />
    </label>
  );
}

export function SelectAll({ ids }: { ids: string[] }) {
  const { selected, setMany } = useBulk();
  if (!ids.length) return null;
  const all = ids.every((id) => selected.has(id));
  return (
    <label className="flex min-h-11 items-center gap-2 text-xs font-medium text-muted">
      <input type="checkbox" className="h-4 w-4 accent-accent" checked={all} onChange={() => setMany(ids, !all)} />
      {es.admin.pieces.bulk.selectColumn}
    </label>
  );
}
