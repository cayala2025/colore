"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { es } from "@/content/es";
import { supabaseBrowser } from "@/lib/supabase/browser";

const LINKS = [
  { href: "/admin", label: es.admin.nav.today },
  { href: "/admin/calendario", label: es.admin.nav.calendar },
  { href: "/admin/piezas", label: es.admin.nav.pieces },
  { href: "/admin/horario", label: es.admin.nav.schedule },
  { href: "/admin/bloqueos", label: es.admin.nav.blocks },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 pt-3">
        <p className="text-xl font-semibold text-accent">
          {es.brand.name} <span className="text-sm font-medium text-muted">{es.admin.title}</span>
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{email}</span>
          <button type="button" onClick={logout} className="min-h-11 rounded-lg px-3 font-medium hover:bg-bg">
            {es.admin.logout}
          </button>
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-2" aria-label={es.admin.title}>
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium ${
                active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
