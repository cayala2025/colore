import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PieceFlow } from "@/components/piece/PieceFlow";
import { es } from "@/content/es";

export const metadata: Metadata = { title: `${es.piece.pageTitle} · ${es.brand.name}` };

export default function PiezaPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
        <h1 className="text-2xl font-semibold">{es.piece.pageTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{es.piece.intro}</p>
        <PieceFlow />
      </main>
    </>
  );
}
