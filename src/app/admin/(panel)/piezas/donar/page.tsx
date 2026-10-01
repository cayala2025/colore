import Link from "next/link";
import { connection } from "next/server";
import { PieceActions } from "@/components/admin/PieceActions";
import { PieceCard } from "@/components/admin/PieceCard";
import { es } from "@/content/es";
import { donationLists } from "@/lib/admin/donations";
import { getDonationPieces, signedPhotoUrls } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/adminAuth";
import { formatDateLong } from "@/lib/format";
import { studioDaysBetween } from "@/lib/time";

export default async function AdminDonatePage() {
  await requireAdmin();
  await connection();
  const now = new Date();
  const { due, soon } = donationLists(await getDonationPieces(), now);
  const photos = await signedPhotoUrls([...due, ...soon].map((p) => p.photo_path));
  const t = es.admin.pieces.donate;
  const day = (checkedIn: string) => studioDaysBetween(new Date(checkedIn), now);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted">{t.intro}</p>
        </div>
        <Link href="/admin/piezas" className="min-h-11 content-center text-sm font-medium text-accent underline">
          {t.back}
        </Link>
      </div>

      <section data-testid="donate-due">
        <h2 className="mb-2 font-semibold">{t.due}</h2>
        {due.length === 0 && <p className="text-sm text-muted">{t.empty}</p>}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {due.map((p) => (
            <PieceCard key={p.id} piece={{ ...p, day: day(p.checked_in_at) }} photoUrl={p.photo_path ? photos[p.photo_path] : undefined}>
              <span className="text-xs text-muted">{t.donatedOn(formatDateLong(p.donatedOn))}</span>
              <PieceActions id={p.id} status={p.status} delayed={p.delayed} />
            </PieceCard>
          ))}
        </div>
      </section>

      <section data-testid="donate-soon">
        <h2 className="mb-2 font-semibold">{t.soon}</h2>
        {soon.length === 0 && <p className="text-sm text-muted">{t.empty}</p>}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {soon.map((p) => (
            <PieceCard key={p.id} piece={{ ...p, day: day(p.checked_in_at) }} photoUrl={p.photo_path ? photos[p.photo_path] : undefined}>
              <span className="text-xs font-medium text-danger">{t.lastDay(formatDateLong(p.lastDay))}</span>
              <PieceActions id={p.id} status={p.status} delayed={p.delayed} />
            </PieceCard>
          ))}
        </div>
      </section>
    </div>
  );
}
