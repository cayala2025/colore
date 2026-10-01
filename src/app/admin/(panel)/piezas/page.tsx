import Link from "next/link";
import { connection } from "next/server";
import { BulkCheckbox, BulkProvider, SelectAll } from "@/components/admin/BulkSelect";
import { PieceActions } from "@/components/admin/PieceActions";
import { PieceCard } from "@/components/admin/PieceCard";
import { WhatsAppButton } from "@/components/admin/WhatsAppButton";
import { es } from "@/content/es";
import { BOARD_COLUMNS, groupPiecesByColumn, PICKED_UP_VISIBLE_DAYS, type BoardColumn, type BoardPiece } from "@/lib/admin/pieceBoard";
import { getBoardPieces, searchPieces, signedPhotoUrls } from "@/lib/admin/queries";
import { readyPieceWhatsappLink } from "@/lib/admin/whatsappMessages";
import { requireAdmin } from "@/lib/adminAuth";
import { studioDaysBetween } from "@/lib/time";

/** Columns whose pieces can be selected for "Marcar lista" in bulk (a kiln load). */
const BULK_COLUMNS: BoardColumn[] = ["received", "firing"];

export default async function AdminPiecesPage({ searchParams }: PageProps<"/admin/piezas">) {
  await requireAdmin();
  await connection();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const t = es.admin.pieces;
  const now = new Date();

  const results: BoardPiece[] | null = query
    ? (await searchPieces(query)).map((p) => ({ ...p, day: studioDaysBetween(new Date(p.checked_in_at), now) }))
    : null;
  const board = results ? null : groupPiecesByColumn(await getBoardPieces(), now);
  const shown = results ?? Object.values(board!).flat();
  const photos = await signedPhotoUrls(shown.map((p) => p.photo_path));
  const photoFor = (p: BoardPiece) => (p.photo_path ? photos[p.photo_path] : undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <Link href="/admin/piezas/donar" className="min-h-11 content-center text-sm font-medium text-accent underline">
            {t.donate.link}
          </Link>
        </div>
        <form action="/admin/piezas" className="flex w-full gap-2 sm:w-auto" role="search">
          <label htmlFor="piece-search" className="sr-only">
            {t.search}
          </label>
          <input
            id="piece-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-base sm:w-80"
          />
          <button type="submit" className="h-12 rounded-xl bg-accent px-4 font-semibold text-accent-ink">
            {t.searchButton}
          </button>
        </form>
      </div>

      {results ? (
        <section data-testid="search-results" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">{t.results(results.length, query)}</p>
            <Link href="/admin/piezas" className="min-h-11 content-center text-sm font-medium text-accent underline">
              {t.clearSearch}
            </Link>
          </div>
          {results.length === 0 && <p className="text-muted">{t.noResults}</p>}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {results.map((p) => (
              <PieceCard key={p.id} piece={p} photoUrl={photoFor(p)}>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium">{t.statusLabel[p.status]}</span>
                <span className="text-xs text-muted">{p.phone}</span>
                {p.status === "ready" && <WhatsAppButton href={readyPieceWhatsappLink(p, now)} />}
                <PieceActions id={p.id} status={p.status} delayed={p.delayed} />
              </PieceCard>
            ))}
          </div>
        </section>
      ) : (
        <BulkProvider>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BOARD_COLUMNS.map((col) => (
              <section key={col} data-testid={`column-${col}`} className="rounded-card bg-line/40 p-3">
                <h2 className="mb-2 flex items-baseline justify-between font-semibold">
                  {t.columns[col]}
                  <span className="text-sm font-medium text-muted">
                    {board![col].length}
                    {col === "picked_up" && ` · ${t.recentPickedUp(PICKED_UP_VISIBLE_DAYS)}`}
                  </span>
                </h2>
                {BULK_COLUMNS.includes(col) && <SelectAll ids={board![col].map((p) => p.id)} />}
                <div className="flex flex-col gap-2">
                  {board![col].length === 0 && <p className="text-sm text-muted">{t.empty}</p>}
                  {board![col].map((p) => (
                    <PieceCard
                      key={p.id}
                      piece={p}
                      photoUrl={photoFor(p)}
                      select={BULK_COLUMNS.includes(col) ? <BulkCheckbox id={p.id} code={p.code} /> : undefined}
                    >
                      {p.status === "ready" && <WhatsAppButton href={readyPieceWhatsappLink(p, now)} />}
                      <PieceActions id={p.id} status={p.status} delayed={p.delayed} />
                    </PieceCard>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </BulkProvider>
      )}
    </div>
  );
}
