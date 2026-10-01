import { connection } from "next/server";
import { PieceCard } from "@/components/admin/PieceCard";
import { es } from "@/content/es";
import { BOARD_COLUMNS, groupPiecesByColumn, PICKED_UP_VISIBLE_DAYS } from "@/lib/admin/pieceBoard";
import { getBoardPieces, signedPhotoUrls } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/adminAuth";

export default async function AdminPiecesPage() {
  await requireAdmin();
  await connection();
  const pieces = await getBoardPieces();
  const board = groupPiecesByColumn(pieces, new Date());
  const photos = await signedPhotoUrls(Object.values(board).flat().map((p) => p.photo_path));
  const t = es.admin.pieces;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_COLUMNS.map((col) => (
          <section key={col} data-testid={`column-${col}`} className="rounded-card bg-line/40 p-3">
            <h2 className="mb-2 flex items-baseline justify-between font-semibold">
              {t.columns[col]}
              <span className="text-sm font-medium text-muted">
                {board[col].length}
                {col === "picked_up" && ` · ${t.recentPickedUp(PICKED_UP_VISIBLE_DAYS)}`}
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {board[col].length === 0 && <p className="text-sm text-muted">{t.empty}</p>}
              {board[col].map((p) => (
                <PieceCard key={p.id} piece={p} photoUrl={p.photo_path ? photos[p.photo_path] : undefined} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
