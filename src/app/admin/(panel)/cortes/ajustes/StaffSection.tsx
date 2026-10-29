"use client";

import { useState, useTransition } from "react";
import { es } from "@/content/es";
import type { StaffMember } from "@/lib/finance/queries";
import { setStaffAccess } from "./staffActions";

export function StaffSection({ staff }: { staff: StaffMember[] }) {
  const t = es.finance.settings.staff;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(target: string, active: boolean) {
    startTransition(async () => {
      const r = await setStaffAccess(target, active);
      if (r.ok) {
        setMessage(active ? { text: t.added, ok: true } : null);
        if (active) setEmail("");
      } else {
        setMessage({ text: r.error === "generic" ? es.finance.settings.error : t[r.error], ok: false });
      }
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <h2 className="font-semibold">{t.title}</h2>
      <p className="text-sm text-muted">{t.hint}</p>
      {staff.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {staff.map((m) => (
            <li key={m.email} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className={m.active ? "" : "text-muted line-through"}>{m.email}</span>
              {m.active ? (
                <button type="button" disabled={pending} onClick={() => run(m.email, false)} className="min-h-11 rounded-lg border border-line px-3 font-medium disabled:opacity-60">
                  {t.remove}
                </button>
              ) : (
                <span className="text-muted">{t.off}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(email, true);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">
          {t.email}
          <input type="email" required className="h-11 rounded-lg border border-line bg-bg px-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink disabled:opacity-60">
          {t.add}
        </button>
      </form>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
