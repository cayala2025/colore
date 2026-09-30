"use client";

import { useRef, useState, type FormEvent } from "react";
import { es } from "@/content/es";
import type { CountryCode } from "@/lib/phone";
import { hasErrors, validateContact, type ContactErrors } from "@/lib/validation";

export type BookingFormValues = {
  name: string;
  country: CountryCode;
  phone: string;
  email: string;
  whatsappOptIn: boolean;
  privacy: boolean;
};

const initialValues: BookingFormValues = {
  name: "",
  country: "52",
  phone: "",
  email: "",
  whatsappOptIn: true,
  privacy: false,
};

type Props = {
  submitting: boolean;
  onSubmit: (values: BookingFormValues) => void;
};

const inputClass =
  "mt-1 block h-12 w-full rounded-xl border border-line bg-bg px-3 text-base placeholder:text-muted/70 focus:border-accent";
const labelClass = "block text-sm font-medium";
const checkRow = "flex min-h-11 items-start gap-3 text-sm";
const checkbox = "mt-0.5 h-5 w-5 shrink-0 accent-accent";

export function BookingForm({ submitting, onSubmit }: Props) {
  const [values, setValues] = useState<BookingFormValues>(initialValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const t = es.booking.form;

  const set = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => {
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
    onSubmit(values);
  }

  const errorText = (field: keyof ContactErrors) => {
    const key = errors[field];
    return key ? (
      <p id={`bk-${field}-error`} role="alert" className="mt-1 text-sm text-danger">
        {es.booking.errors[key]}
      </p>
    ) : null;
  };
  const invalidProps = (field: keyof ContactErrors) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `bk-${field}-error` } : {};

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="bk-name" className={labelClass}>
          {t.name}
        </label>
        <input
          id="bk-name"
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
        <label htmlFor="bk-phone" className={labelClass}>
          {t.phone}
        </label>
        <div className="flex gap-2">
          <select
            aria-label={t.country}
            name="country"
            className={`${inputClass} w-32 shrink-0`}
            value={values.country}
            onChange={(e) => set("country", e.target.value as CountryCode)}
          >
            <option value="52">{t.countryMx}</option>
            <option value="1">{t.countryUs}</option>
          </select>
          <input
            id="bk-phone"
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
        <label htmlFor="bk-email" className={labelClass}>
          {t.email}
        </label>
        <input
          id="bk-email"
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
          id="bk-privacy"
          type="checkbox"
          name="privacy"
          className={checkbox}
          checked={values.privacy}
          onChange={(e) => set("privacy", e.target.checked)}
          {...invalidProps("privacy")}
        />
        <span>
          <label htmlFor="bk-privacy">{t.privacy}</label>{" "}
          <a href="/privacidad" target="_blank" className="text-accent underline">
            {t.privacyLink}
          </a>
          {errorText("privacy")}
        </span>
      </div>

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
