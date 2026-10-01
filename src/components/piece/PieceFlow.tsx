"use client";

import { useState } from "react";
import { StepCard } from "@/components/booking/StepCard";
import { ContactForm, type ContactFormValues } from "@/components/ContactForm";
import { es } from "@/content/es";
import { compressImage } from "@/lib/compressImage";
import { DONATE_DAY, READY_DAYS } from "@/lib/pieceTimeline";
import { PhotoStep } from "./PhotoStep";

export function PieceFlow() {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const t = es.piece;

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

  async function handleSubmit(values: ContactFormValues, turnstileToken: string) {
    if (!photo) {
      setFormError(t.errors.photoRequired);
      return;
    }
    void values;
    void turnstileToken; // Sent to POST /api/pieces in a later step.
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <StepCard id="step-photo" label={t.photo.stepLabel} title={t.photo.title} locked={false}>
        <PhotoStep photo={photo} accepted={accepted} onFile={handleFile} onAccept={() => setAccepted(true)} />
        {processing && (
          <p role="status" className="mt-3 text-center text-sm text-muted">
            {t.photo.processing}
          </p>
        )}
        {photoError && (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {t.photo.error}
          </p>
        )}
      </StepCard>

      <StepCard id="step-piece-form" label={t.form.stepLabel} title={t.form.title} locked={!photo || !accepted}>
        <ContactForm
          idPrefix="pz"
          consentLabel={t.form.policy}
          consentRequiredError={t.form.policyRequired}
          consentDetails={<span className="mt-1 block text-xs text-muted">{t.form.policyText(READY_DAYS, DONATE_DAY)}</span>}
          submitLabel={t.form.submit}
          submittingLabel={t.form.submitting}
          submitting={submitting}
          formError={formError}
          onSubmit={handleSubmit}
        />
      </StepCard>
    </div>
  );
}
