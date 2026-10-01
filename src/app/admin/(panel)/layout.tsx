import type { Metadata } from "next";
import { requireAdmin } from "@/lib/adminAuth";
import { es } from "@/content/es";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: `${es.admin.title} · ${es.brand.name}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AdminNav email={admin.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
