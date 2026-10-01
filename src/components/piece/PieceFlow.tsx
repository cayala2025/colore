"use client";

import { useState } from "react";
import { StepCard } from "@/components/booking/StepCard";
import { es } from "@/content/es";
import { PhotoStep } from "./PhotoStep";

export function PieceFlow() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <StepCard id="step-photo" label={es.piece.photo.stepLabel} title={es.piece.photo.title} locked={false}>
        <PhotoStep onFile={setFile} />
        {file && <p className="sr-only">{file.name}</p>}
      </StepCard>
    </div>
  );
}
