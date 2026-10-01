"use client";

import { startTransition, useActionState, useState } from "react";
import { es } from "@/content/es";
import { cancelAction, confirmAction, type ManageActionState } from "./actions";

type Props = {
  token: string;
  canConfirm: boolean;
  canCancel: boolean;
  /** Action preselected from the email link (?accion=confirmar|cancelar). */
  intent: "confirmar" | "cancelar" | null;
};

const initial: ManageActionState = { ok: false, error: false };

export function ManageActions({ token, canConfirm, canCancel, intent }: Props) {
  const t = es.manage;
  const [confirmState, confirm, confirming] = useActionState(() => confirmAction(token), initial);
  const [cancelState, cancel, cancelling] = useActionState(() => cancelAction(token), initial);
  // Cancelling asks first. Opening the email's "Cancelar" link shows the question right away.
  const [asking, setAsking] = useState(intent === "cancelar");

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
      {canCancel && !asking && (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="h-12 rounded-xl border border-line font-medium hover:border-danger hover:text-danger"
        >
          {t.cancel}
        </button>
      )}
      {canCancel && asking && (
        <div data-testid="cancel-ask" className="rounded-xl border border-danger/40 bg-danger/5 p-4">
          <p className="text-sm">{t.cancelAsk}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="h-12 rounded-xl border border-line bg-surface font-medium"
            >
              {t.cancelNo}
            </button>
            <button
              type="button"
              onClick={() => startTransition(cancel)}
              disabled={cancelling}
              className="h-12 rounded-xl bg-danger font-semibold text-white disabled:opacity-60"
            >
              {cancelling ? t.cancelling : t.cancelYes}
            </button>
          </div>
        </div>
      )}
      {(confirmState.error || cancelState.error) && (
        <p role="alert" className="text-center text-sm text-danger">
          {t.error}
        </p>
      )}
    </div>
  );
}
