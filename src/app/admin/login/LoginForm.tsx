"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { es } from "@/content/es";
import { supabaseBrowser } from "@/lib/supabase/browser";

const inputClass = "mt-1 block h-12 w-full rounded-xl border border-line bg-bg px-3 text-base focus:border-accent";

export function LoginForm({ notAdmin }: { notAdmin: boolean }) {
  const t = es.admin.login;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(notAdmin ? t.notAdmin : null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: authError } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.status === 400 ? t.invalid : t.error);
      setSubmitting(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="admin-email" className="block text-sm font-medium">
          {t.email}
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium">
          {t.password}
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-xl bg-accent font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}
