"use client";

import { useId, type ChangeEvent } from "react";
import { es } from "@/content/es";

type Props = {
  onFile: (file: File) => void;
};

/** Big button that opens the phone's rear camera (falls back to file picker on desktop). */
export function PhotoStep({ onFile }: Props) {
  const inputId = useId();
  const t = es.piece.photo;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (file) onFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <label
        htmlFor={inputId}
        className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-card bg-accent text-2xl font-semibold text-accent-ink hover:bg-accent-hover focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent"
      >
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {t.take}
      </label>
      <input
        id={inputId}
        data-testid="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
      />
      <p className="text-sm text-muted">{t.hint}</p>
    </div>
  );
}
