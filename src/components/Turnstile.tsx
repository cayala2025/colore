"use client";

import { useEffect, useRef, useState } from "react";
import { es } from "@/content/es";
import { turnstileSiteKey } from "@/lib/turnstileKeys";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

type Props = {
  onToken: (token: string | null) => void;
  /** Change this value to get a fresh token (tokens are single-use). */
  resetKey?: number;
};

export function Turnstile({ onToken, resetKey = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: turnstileSiteKey({
            NODE_ENV: process.env.NODE_ENV,
            NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          }),
          language: "es",
          appearance: "interaction-only",
          callback: (token: string) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": (code: string) => {
            console.error(`[turnstile] error ${code}`);
            setFailed(true);
            onTokenRef.current(null);
            return true; // handled: we show our own message
          },
        });
      })
      .catch(() => {
        setFailed(true);
        onTokenRef.current(null);
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && widgetId.current && window.turnstile) {
      onTokenRef.current(null);
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  function retry() {
    setFailed(false);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    else window.location.reload();
  }

  return (
    <>
      <div ref={ref} className="min-h-0" />
      {failed && (
        <div role="alert" data-testid="turnstile-error" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
          <span>{es.booking.form.turnstileFailed}</span>
          <button type="button" onClick={retry} className="min-h-11 rounded-lg border border-line bg-surface px-3 font-medium text-ink">
            {es.booking.date.retry}
          </button>
        </div>
      )}
    </>
  );
}
