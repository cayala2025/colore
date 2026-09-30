"use client";

import { useState } from "react";
import { es } from "@/content/es";
import { monthOf } from "@/lib/calendar";
import { CalendarStep } from "./CalendarStep";
import { PartyStep } from "./PartyStep";
import { StepCard } from "./StepCard";

type Props = {
  /** Today's date in the studio timezone ("YYYY-MM-DD"), computed on the server. */
  today: string;
};

export function BookingFlow({ today }: Props) {
  const [party, setParty] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [month, setMonth] = useState(monthOf(today));

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
          minMonth={monthOf(today)}
          maxMonth={monthOf(today)}
          selected={date}
          isDisabled={() => false}
          onSelect={setDate}
          onMonthChange={setMonth}
        />
      </StepCard>
    </div>
  );
}
