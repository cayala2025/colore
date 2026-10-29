import type { Metadata } from "next";
import Link from "next/link";
import { es } from "@/content/es";
import { requireAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: `${es.finance.pos.title} · ${es.brand.name}`,
  robots: { index: false, follow: false },
};

export default async function CobroLayout({ children }: LayoutProps<"/cobro">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2">
        <p className="text-xl font-semibold text-accent">
          {es.brand.name} <span className="text-sm font-medium text-muted">{es.finance.pos.title}</span>
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{admin.email}</span>
          <Link href="/admin" className="flex min-h-11 items-center rounded-lg px-3 font-medium hover:bg-bg">
            {es.finance.pos.backToAdmin}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
