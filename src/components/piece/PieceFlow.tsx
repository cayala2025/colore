"use client";

import { useState } from "react";
import { StepCard } from "@/components/booking/StepCard";
import { es } from "@/content/es";
import { compressImage } from "@/lib/compressImage";
import { PhotoStep } from "./PhotoStep";

export function PieceFlow() {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleFile(file: File) {
    setProcessing(true);
    setPhotoError(false);
    try {
      setPhoto(await compressImage(file));
      setAccepted(false);
    } catch {
      setPhotoError(true);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <StepCard id="step-photo" label={es.piece.photo.stepLabel} title={es.piece.photo.title} locked={false}>
        <PhotoStep photo={photo} accepted={accepted} onFile={handleFile} onAccept={() => setAccepted(true)} />
        {processing && (
          <p role="status" className="mt-3 text-center text-sm text-muted">
            {es.piece.photo.processing}
          </p>
        )}
        {photoError && (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {es.piece.photo.error}
          </p>
        )}
      </StepCard>
    </div>
  );
}
