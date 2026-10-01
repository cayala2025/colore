"use client";

import { useState, useTransition } from "react";
import { applyPieceAction } from "@/app/admin/(panel)/piezas/actions";
import { es } from "@/content/es";
import { availableActions, type PieceAction } from "@/lib/admin/pieceTransitions";
import type { PieceStatus } from "@/lib/pieceTimeline";

const STYLE: Record<PieceAction, string> = {
  firing: "border-line bg-surface",
  ready: "border-success bg-success text-white",
  delay: "border-line bg-surface text-danger",
  undelay: "border-line bg-surface",
  pickedUp: "border-accent bg-accent text-accent-ink",
};

export function PieceActions({ id, status, delayed }: { id: string; status: PieceStatus; delayed: boolean }) {
  const t = es.admin.pieces.actions;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const run = (action: PieceAction) =>
    startTransition(async () => {
      setError(false);
      const { ok } = await applyPieceAction([id], action);
      if (!ok) setError(true);
    });

  return (
    <>
      {availableActions({ status, delayed }).map((a) => (
        <button
          key={a}
          type="button"
          disabled={pending}
          onClick={() => run(a)}
          className={`min-h-11 rounded-lg border px-3 text-sm font-medium disabled:opacity-50 ${STYLE[a]}`}
        >
          {t[a]}
        </button>
      ))}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {t.error}
        </span>
      )}
    </>
  );
}
