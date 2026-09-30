"use client";

import { useState } from "react";
import { es } from "@/content/es";
import { PartyStep } from "./PartyStep";
import { StepCard } from "./StepCard";

export function BookingFlow() {
  const [party, setParty] = useState<number | null>(null);

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
    </div>
  );
}
