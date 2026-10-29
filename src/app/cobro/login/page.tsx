import type { Metadata } from "next";
import { es } from "@/content/es";
import { LoginForm } from "@/app/admin/login/LoginForm";

export const metadata: Metadata = {
  title: `${es.finance.pos.login.title} · ${es.brand.name}`,
  robots: { index: false, follow: false },
};

export default async function CobroLoginPage({ searchParams }: PageProps<"/cobro/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <p className="text-center text-3xl font-semibold text-accent">{es.brand.name}</p>
      <h1 className="mt-2 mb-6 text-center text-xl font-semibold">{es.finance.pos.login.title}</h1>
      <div className="rounded-card border border-line bg-surface p-6">
        <LoginForm notAdmin={error === "not_staff"} redirectTo="/cobro" deniedText={es.finance.pos.login.notStaff} />
      </div>
    </main>
  );
}
