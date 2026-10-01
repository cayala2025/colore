"use client";

import { useState } from "react";
import { StepCard } from "@/components/booking/StepCard";
import { ContactForm, type ContactFormValues } from "@/components/ContactForm";
import { es } from "@/content/es";
import { compressImage } from "@/lib/compressImage";
import type { CountryCode } from "@/lib/phone";
import { DONATE_DAY, READY_DAYS } from "@/lib/pieceTimeline";
import { PhotoStep } from "./PhotoStep";

async function lookupTodaysBooking(country: CountryCode, phone: string) {
  const res = await fetch("/api/pieces/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, phone }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { booking: { name: string; email: string } | null };
  return body.booking;
}

export function PieceFlow() {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [result, setResult] = useState<{ code: string; readyDate: string } | null>(null);
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
    setSubmitting(true);
    setFormError(null);
    const form = new FormData();
    form.append("photo", photo, "pieza.jpg");
    form.append("name", values.name);
    form.append("country", values.country);
    form.append("phone", values.phone);
    form.append("email", values.email);
    form.append("whatsappOptIn", String(values.whatsappOptIn));
    form.append("policy", String(values.privacy));
    form.append("turnstileToken", turnstileToken);
    try {
      const res = await fetch("/api/pieces", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as {
        piece?: { code: string; readyDate: string };
        error?: string;
      };
      if (res.ok && body.piece) {
        setResult(body.piece);
        return;
      }
      setFormError(
        body.error === "turnstile"
          ? es.booking.errors.turnstile
          : body.error === "upload"
            ? t.errors.upload
            : es.booking.errors.generic,
      );
    } catch {
      setFormError(t.errors.upload);
    } finally {
      setSubmitting(false);
    }
    setTurnstileResetKey((k) => k + 1);
  }

  if (result) {
    return (
      <section data-testid="piece-success" className="rounded-card border border-line bg-surface p-6 text-center">
        <p className="text-5xl font-bold">{result.code}</p>
      </section>
    );
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
          lookupPhone={lookupTodaysBooking}
          prefilledNote={t.form.prefilled}
          submitLabel={t.form.submit}
          submittingLabel={t.form.submitting}
          submitting={submitting}
          formError={formError}
          turnstileResetKey={turnstileResetKey}
          onSubmit={handleSubmit}
        />
      </StepCard>
    </div>
  );
}
