"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Turnstile } from "@/components/Turnstile";
import { es } from "@/content/es";
import type { CountryCode } from "@/lib/phone";
import { hasErrors, validateContact, type ContactErrors } from "@/lib/validation";

export type ContactFormValues = {
  name: string;
  country: CountryCode;
  phone: string;
  email: string;
  whatsappOptIn: boolean;
  privacy: boolean;
};

const defaultValues: ContactFormValues = {
  name: "",
  country: "52",
  phone: "",
  email: "",
  whatsappOptIn: true,
  privacy: false,
};

type Props = {
  /** Unique prefix for input ids. */
  idPrefix: string;
  /** Required consent checkbox (privacy notice for bookings, pickup policy for pieces). */
  consentLabel: ReactNode;
  consentRequiredError: string;
  /** Extra content under the consent checkbox (e.g. the policy text). */
  consentDetails?: ReactNode;
  submitLabel: string;
  submittingLabel: string;
  initialValues?: Partial<ContactFormValues>;
  submitting: boolean;
  /** Error shown above the submit button (e.g. from the API). */
  formError?: string | null;
  /** Bump to request a fresh Turnstile token after a failed submit. */
  turnstileResetKey?: number;
  onSubmit: (values: ContactFormValues, turnstileToken: string) => void;
};

const fieldClass =
  "mt-1 block h-12 rounded-xl border border-line bg-bg px-3 text-base placeholder:text-muted/70 focus:border-accent";
const inputClass = `${fieldClass} w-full min-w-0`;
const labelClass = "block text-sm font-medium";
const checkRow = "flex min-h-11 items-start gap-3 text-sm";
const checkbox = "mt-0.5 h-5 w-5 shrink-0 accent-accent";

export function ContactForm({
  idPrefix,
  consentLabel,
  consentRequiredError,
  consentDetails,
  submitLabel,
  submittingLabel,
  initialValues,
  submitting,
  formError,
  turnstileResetKey,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ContactFormValues>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const t = es.booking.form;

  const set = <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    // After the first submit attempt, re-validate live so errors disappear as they get fixed.
    if (touched) setErrors(validateContact(next));
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    setTouched(true);
    if (hasErrors(found)) {
      // Wait for the error state to render, then focus the first invalid field.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    if (token) onSubmit(values, token);
  }

  const errorText = (field: keyof ContactErrors) => {
    const key = errors[field];
    return key ? (
      <p id={`${idPrefix}-${field}-error`} role="alert" className="mt-1 text-sm text-danger">
        {key === "privacyRequired" ? consentRequiredError : es.booking.errors[key]}
      </p>
    ) : null;
  };
  const invalidProps = (field: keyof ContactErrors) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${idPrefix}-${field}-error` } : {};

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>
          {t.name}
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          autoComplete="name"
          placeholder={t.namePlaceholder}
          className={inputClass}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          {...invalidProps("name")}
        />
        {errorText("name")}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-phone`} className={labelClass}>
          {t.phone}
        </label>
        <div className="flex gap-2">
          <select
            aria-label={t.country}
            name="country"
            className={`${fieldClass} w-28 shrink-0 px-2`}
            value={values.country}
            onChange={(e) => set("country", e.target.value as CountryCode)}
          >
            <option value="52">{t.countryMx}</option>
            <option value="1">{t.countryUs}</option>
          </select>
          <input
            id={`${idPrefix}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={t.phonePlaceholder}
            className={inputClass}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            {...invalidProps("phone")}
          />
        </div>
        {errorText("phone")}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-email`} className={labelClass}>
          {t.email}
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          className={inputClass}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          {...invalidProps("email")}
        />
        {errorText("email")}
      </div>

      <label className={checkRow}>
        <input
          type="checkbox"
          name="whatsappOptIn"
          className={checkbox}
          checked={values.whatsappOptIn}
          onChange={(e) => set("whatsappOptIn", e.target.checked)}
        />
        <span>{t.whatsappOptIn}</span>
      </label>

      <div className={checkRow}>
        <input
          id={`${idPrefix}-privacy`}
          type="checkbox"
          name="privacy"
          className={checkbox}
          checked={values.privacy}
          onChange={(e) => set("privacy", e.target.checked)}
          {...invalidProps("privacy")}
        />
        <span>
          <label htmlFor={`${idPrefix}-privacy`}>{consentLabel}</label>
          {consentDetails}
          {errorText("privacy")}
        </span>
      </div>

      <Turnstile onToken={setToken} resetKey={turnstileResetKey} />
      {formError && (
        <p role="alert" data-testid="form-error" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {formError}
        </p>
      )}
      {!token && (
        <p role="status" className="text-center text-xs text-muted">
          {t.turnstileLoading}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !token}
        className="h-12 rounded-xl bg-accent font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
