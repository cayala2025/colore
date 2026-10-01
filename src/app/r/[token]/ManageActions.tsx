"use client";

import { startTransition, useActionState } from "react";
import { es } from "@/content/es";
import { confirmAction, type ManageActionState } from "./actions";

type Props = {
  token: string;
  canConfirm: boolean;
  canCancel: boolean;
  /** Action preselected from the email link (?accion=confirmar|cancelar). */
  intent: "confirmar" | "cancelar" | null;
};

const initial: ManageActionState = { ok: false, error: false };

export function ManageActions({ token, canConfirm, intent }: Props) {
  const t = es.manage;
  const [confirmState, confirm, confirming] = useActionState(() => confirmAction(token), initial);

  return (
    <div className="mt-6 flex flex-col gap-3">
      {canConfirm && (
        <button
          type="button"
          onClick={() => startTransition(confirm)}
          disabled={confirming}
          autoFocus={intent === "confirmar"}
          className="h-12 rounded-xl bg-accent font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {confirming ? t.confirming : t.confirm}
        </button>
      )}
      {confirmState.ok && (
        <p role="status" className="text-center font-medium text-success">
          {t.confirmed}
        </p>
      )}
      {confirmState.error && (
        <p role="alert" className="text-center text-sm text-danger">
          {t.error}
        </p>
      )}
    </div>
  );
}
