"use client";

import { useState } from "react";
import { es } from "@/content/es";
import { bookableMonths, isMonday, isWithinBookingWindow } from "@/lib/bookingWindow";
import { monthOf } from "@/lib/calendar";
import { fakeSlotsFor } from "@/lib/fakeAvailability";
import type { DaySlot } from "@/lib/types";
import { BookingForm, type BookingFormValues } from "./BookingForm";
import { CalendarStep } from "./CalendarStep";
import { PartyStep } from "./PartyStep";
import { StepCard } from "./StepCard";
import { SuccessScreen } from "./SuccessScreen";
import { TimeStep } from "./TimeStep";

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

  const months = bookableMonths(today);
  const isDisabled = (d: string) => isMonday(d) || !isWithinBookingWindow(d, today);
  const slots = date ? fakeSlotsFor(date) : [];
  const chosenSlot = slots.find((s) => s.start === slot) ?? null;

  function reset() {
    setParty(null);
    setDate(null);
    setSlot(null);
    setMonth(monthOf(today));
    setConfirmed(null);
  }

  async function handleSubmit(values: BookingFormValues) {
    if (!party || !date || !chosenSlot) return;
    void values; // Sent to the API in Sprint 2.
    setSubmitting(true);
    setConfirmed({ date, slot: chosenSlot, party });
    setSubmitting(false);
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
        <PartyStep value={party} onChange={setParty} />
      </StepCard>

      <StepCard id="step-date" label={es.booking.date.stepLabel} title={es.booking.date.title} locked={false}>
        <CalendarStep
          month={month}
          minMonth={months.min}
          maxMonth={months.max}
          selected={date}
          isDisabled={isDisabled}
          onSelect={(d) => {
            setDate(d);
            setSlot(null);
          }}
          onMonthChange={setMonth}
        />
      </StepCard>

      <StepCard id="step-time" label={es.booking.time.stepLabel} title={es.booking.time.title} locked={false}>
        <TimeStep slots={slots} party={party ?? 1} selected={slot} onSelect={setSlot} />
      </StepCard>

      <StepCard id="step-form" label={es.booking.form.stepLabel} title={es.booking.form.title} locked={false}>
        <BookingForm submitting={submitting} onSubmit={handleSubmit} />
      </StepCard>
    </div>
  );
}
