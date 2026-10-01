import type { PieceStatus } from "../pieceTimeline";

export type PieceAction = "firing" | "ready" | "delay" | "undelay" | "pickedUp";
export const PIECE_ACTIONS: PieceAction[] = ["firing", "ready", "delay", "undelay", "pickedUp"];

/** Which statuses each staff action applies to. */
export const ACTION_FROM: Record<PieceAction, PieceStatus[]> = {
  firing: ["received"],
  ready: ["received", "firing"],
  delay: ["received", "firing"],
  undelay: ["received", "firing"],
  pickedUp: ["received", "firing", "ready"],
};

/** Buttons to show for a piece. */
export function availableActions(p: { status: PieceStatus; delayed: boolean }): PieceAction[] {
  return PIECE_ACTIONS.filter(
    (a) => ACTION_FROM[a].includes(p.status) && !(a === "delay" && p.delayed) && !(a === "undelay" && !p.delayed),
  );
}

/** Column updates for an action (timestamps filled in by the caller). */
export function actionUpdate(action: PieceAction, nowIso: string): Record<string, unknown> {
  switch (action) {
    case "firing":
      return { status: "firing" };
    case "ready":
      return { status: "ready", ready_at: nowIso, delayed: false };
    case "delay":
      return { delayed: true };
    case "undelay":
      return { delayed: false };
    case "pickedUp":
      return { status: "picked_up", picked_up_at: nowIso };
  }
}
