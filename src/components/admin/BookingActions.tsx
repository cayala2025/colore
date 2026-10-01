"use client";

import { useState, useTransition } from "react";
import { setBookingStatus } from "@/app/admin/(panel)/actions";
import { es } from "@/content/es";
import type { BookingStatus } from "@/lib/types";

const btn = "min-h-11 rounded-lg border px-3 text-sm font-medium disabled:opacity-50";

export function BookingActions({ id, status }: { id: string; status: BookingStatus }) {
  const t = es.admin.bookingActions;
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(false);

  const set = (to: BookingStatus) =>
    startTransition(async () => {
      setError(false);
      const { ok } = await setBookingStatus(id, to);
      if (!ok) setError(true);
      setAsking(false);
    });

  if (status === "cancelled") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "confirmed" && !asking && (
        <>
          <button type="button" disabled={pending} onClick={() => set("attended")} className={`${btn} border-success bg-success text-white`}>
            {t.attended}
          </button>
          <button type="button" disabled={pending} onClick={() => set("no_show")} className={`${btn} border-line bg-surface`}>
            {t.noShow}
          </button>
          <button type="button" disabled={pending} onClick={() => setAsking(true)} className={`${btn} border-line bg-surface text-danger`}>
            {t.cancel}
          </button>
        </>
      )}
      {status === "confirmed" && asking && (
        <span className="flex items-center gap-2 text-sm">
          {t.cancelConfirm}
          <button type="button" disabled={pending} onClick={() => set("cancelled")} className={`${btn} border-danger bg-danger text-white`}>
            {t.cancelYes}
          </button>
          <button type="button" disabled={pending} onClick={() => setAsking(false)} className={`${btn} border-line bg-surface`}>
            {t.cancelNo}
          </button>
        </span>
      )}
      {(status === "attended" || status === "no_show") && (
        <button type="button" disabled={pending} onClick={() => set("confirmed")} className={`${btn} border-line bg-surface`}>
          {t.undo}
        </button>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {t.error}
        </span>
      )}
    </div>
  );
}
