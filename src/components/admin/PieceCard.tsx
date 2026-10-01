import type { ReactNode } from "react";
import { es } from "@/content/es";
import type { BoardPiece } from "@/lib/admin/pieceBoard";

type Props = {
  piece: BoardPiece;
  photoUrl?: string;
  /** Slot for a selection checkbox (bulk actions). */
  select?: ReactNode;
  children?: ReactNode;
};

export function PieceCard({ piece, photoUrl, select, children }: Props) {
  const t = es.admin.pieces;
  return (
    <article data-testid={`piece-${piece.code}`} className="rounded-xl border border-line bg-surface p-3">
      <div className="flex gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from a private bucket
          <img src={photoUrl} alt={t.photoAlt(piece.code)} className="h-16 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-bg text-center text-[10px] text-muted">
            {t.noPhoto}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-lg font-bold leading-tight">{piece.code}</p>
            {select}
          </div>
          <p className="truncate text-sm">{piece.name}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{t.day(piece.day)}</span>
            {piece.delayed && <span className="rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">{t.delayed}</span>}
          </p>
        </div>
      </div>
      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </article>
  );
}
