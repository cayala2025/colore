"use client";

import { useState } from "react";
import { es } from "@/content/es";
import type { BookingApiError } from "@/lib/bookingErrors";
import { bookableMonths } from "@/lib/bookingWindow";
import { monthOf } from "@/lib/calendar";
import { formatDateLong, formatTimeRange } from "@/lib/format";
import type { DaySlot } from "@/lib/types";
import { ContactForm, type ContactFormValues } from "@/components/ContactForm";
import { CalendarStep } from "./CalendarStep";
import { NotesBox } from "./NotesBox";
import { PartyStep } from "./PartyStep";
import { StepCard } from "./StepCard";
import { SuccessScreen } from "./SuccessScreen";
import { TimeStep } from "./TimeStep";
import { useAvailability } from "./useAvailability";

type Props = {
  /** Today's date in the studio timezone ("YYYY-MM-DD"), computed on the server. */
  today: string;
};

type Confirmed = { date: string; slot: DaySlot; party: number };

export function BookingFlow({ today }: Props) {
  const [party, setParty] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  /** Shown on the date/time step when the chosen slot or day stopped being available. */
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const months = bookableMonths(today);
  // Load the month on screen and the month of the chosen date.
  const availability = useAvailability(party, date ? [month, monthOf(date)] : [month]);
  const isDisabled = (d: string) => !availability.day(d)?.bookable;
  const slots = (date && availability.day(date)?.slots) || [];
  const chosenSlot = slots.find((s) => s.start === slot) ?? null;

  /** Bring the next step into view once it unlocks (it renders on the next frame). */
  function reveal(stepId: string) {
    requestAnimationFrame(() =>
      document.querySelector(`[data-testid="${stepId}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function chooseParty(n: number) {
    setParty(n);
    // Keep the chosen slot only if the new party still fits.
    if (chosenSlot && chosenSlot.seatsLeft < n) setSlot(null);
    if (!date) reveal("step-date");
  }

  function chooseDate(d: string) {
    setSlotNotice(null);
    setDate(d);
    setSlot(null);
    reveal("step-time");
  }

  function chooseSlot(start: string) {
    setSlotNotice(null);
    setFormError(null);
    setSlot(start);
    reveal("step-form");
  }

  function handleApiError(error: BookingApiError | undefined) {
    const e = es.booking.errors;
    switch (error) {
      case "slotFull":
      case "slotStarted":
        // Someone took the last seats (or time ran out): pick another slot with fresh data.
        setSlot(null);
        setSlotNotice(error === "slotFull" ? e.slotFull : e.slotStarted);
        availability.reload();
        reveal("step-time");
        return;
      case "dateBlocked":
        setDate(null);
        setSlot(null);
        setSlotNotice(e.dateBlocked);
        availability.reload();
        reveal("step-date");
        return;
      case "phoneHasBooking":
        setFormError(e.phoneHasBooking);
        return;
      case "turnstile":
        setFormError(e.turnstile);
        return;
      default:
        setFormError(e.generic);
    }
  }

  function reset() {
    setParty(null);
    setDate(null);
    setSlot(null);
    setMonth(monthOf(today));
    setConfirmed(null);
    setFormError(null);
    setSlotNotice(null);
  }

  async function handleSubmit(values: ContactFormValues, turnstileToken: string) {
    if (!party || !date || !chosenSlot) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, date, start: chosenSlot.start, party, turnstileToken }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        booking?: { date: string; start: string; end: string; party: number };
        error?: string;
      };
      if (res.ok && body.booking) {
        const b = body.booking;
        setConfirmed({ date: b.date, slot: { ...chosenSlot, start: b.start, end: b.end }, party: b.party });
        return;
      }
      handleApiError(body.error as BookingApiError | undefined);
    } catch {
      setFormError(es.booking.errors.generic);
    } finally {
      setSubmitting(false);
    }
    // Turnstile tokens are single-use: get a fresh one for the next attempt.
    setTurnstileResetKey((k) => k + 1);
  }

  if (confirmed) {
    return (
      <SuccessScreen
        date={confirmed.date}
        start={confirmed.slot.start}
        end={confirmed.slot.end}
        party={confirmed.party}
        onReset={reset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StepCard
        id="step-people"
        label={es.booking.people.stepLabel}
        title={es.booking.people.title}
        locked={false}
        summary={party ? es.booking.people.summary(party) : undefined}
      >
        <PartyStep value={party} onChange={chooseParty} />
      </StepCard>

      <StepCard
        id="step-date"
        label={es.booking.date.stepLabel}
        title={es.booking.date.title}
        locked={!party}
        summary={date ? formatDateLong(date) : undefined}
      >
        {!date && slotNotice && (
          <p role="alert" className="mb-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{slotNotice}</p>
        )}
        <CalendarStep
          month={month}
          minMonth={months.min}
          maxMonth={months.max}
          selected={date}
          isDisabled={isDisabled}
          onSelect={chooseDate}
          onMonthChange={setMonth}
        />
        {availability.loading && (
          <p role="status" className="mt-3 text-center text-sm text-muted">
            {es.booking.date.loading}
          </p>
        )}
        {availability.error && (
          <div role="alert" className="mt-3 flex items-center justify-between gap-2 text-sm text-danger">
            <span>{es.booking.date.loadError}</span>
            <button
              type="button"
              onClick={availability.reload}
              className="min-h-11 rounded-lg border border-line px-3 font-medium text-ink"
            >
              {es.booking.date.retry}
            </button>
          </div>
        )}
      </StepCard>

      <StepCard
        id="step-time"
        label={es.booking.time.stepLabel}
        title={es.booking.time.title}
        locked={!party || !date}
        summary={chosenSlot ? formatTimeRange(chosenSlot.start, chosenSlot.end) : undefined}
      >
        {slotNotice && (
          <p role="alert" data-testid="slot-notice" className="mb-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            {slotNotice}
          </p>
        )}
        <TimeStep slots={slots} party={party ?? 1} selected={slot} onSelect={chooseSlot} />
      </StepCard>

      <StepCard
        id="step-form"
        label={es.booking.form.stepLabel}
        title={es.booking.form.title}
        locked={!party || !date || !chosenSlot}
      >
        <ContactForm
          idPrefix="bk"
          consentLabel={es.booking.form.privacy}
          consentRequiredError={es.booking.errors.privacyRequired}
          consentDetails={
            <>
              {" "}
              <a href="/privacidad" target="_blank" className="text-accent underline">
                {es.booking.form.privacyLink}
              </a>
            </>
          }
          submitLabel={es.booking.form.submit}
          submittingLabel={es.booking.form.submitting}
          submitting={submitting}
          formError={formError}
          turnstileResetKey={turnstileResetKey}
          onSubmit={handleSubmit}
        />
      </StepCard>

      <NotesBox />
    </div>
  );
}
