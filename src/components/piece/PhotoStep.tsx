"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import { es } from "@/content/es";

type Props = {
  photo: Blob | null;
  accepted: boolean;
  onFile: (file: File) => void;
  onAccept: () => void;
};

/** Big button that opens the phone's rear camera, then a preview with "Otra foto" / "Usar esta". */
export function PhotoStep({ photo, accepted, onFile, onAccept }: Props) {
  const inputId = useId();
  const t = es.piece.photo;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL must be created/revoked with the blob
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (file) onFile(file);
  }

  const input = (
    <input
      id={inputId}
      data-testid="photo-input"
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={handleChange}
    />
  );

  if (photo && previewUrl) {
    return (
      <div className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img
          src={previewUrl}
          alt={t.previewAlt}
          data-testid="photo-preview"
          className={`w-full rounded-xl border border-line object-cover ${accepted ? "max-h-40" : "max-h-96"}`}
        />
        <div className={`grid gap-2 ${accepted ? "grid-cols-1" : "grid-cols-2"}`}>
          <label
            htmlFor={inputId}
            className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-line bg-bg font-medium hover:border-accent focus-within:outline focus-within:outline-3 focus-within:outline-accent"
          >
            {t.retake}
          </label>
          {!accepted && (
            <button
              type="button"
              onClick={onAccept}
              className="h-12 rounded-xl bg-accent font-semibold text-accent-ink hover:bg-accent-hover"
            >
              {t.use}
            </button>
          )}
        </div>
        {input}
      </div>
    );
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
      {input}
      <p className="text-sm text-muted">{t.hint}</p>
    </div>
  );
}
