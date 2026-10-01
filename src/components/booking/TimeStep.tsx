import { es } from "@/content/es";
import type { PublicSlot } from "@/lib/types";

type Props = {
  slots: PublicSlot[];
  selected: string | null;
  onSelect: (start: string) => void;
};

export function TimeStep({ slots, selected, onSelect }: Props) {
  if (slots.length === 0) return <p className="text-sm text-muted">{es.booking.time.none}</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => {
        const isSelected = selected === slot.start;
        const full = !slot.available;
        return (
          <button
            key={slot.start}
            type="button"
            data-slot={slot.start}
            disabled={full}
            aria-pressed={isSelected}
            onClick={() => onSelect(slot.start)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-2 transition-colors ${
              isSelected
                ? "border-accent bg-accent text-accent-ink"
                : full
                  ? "cursor-not-allowed border-line bg-bg text-disabled"
                  : "border-line bg-bg hover:border-accent"
            }`}
          >
            <span className={`font-medium ${full ? "line-through" : ""}`}>
              {es.format.timeRange(slot.start, slot.end)}
            </span>
            <span className={`text-xs ${isSelected ? "" : full ? "font-medium text-muted" : "text-muted"}`}>
              {full ? es.booking.time.unavailable : es.booking.time.available}
            </span>
          </button>
        );
      })}
    </div>
  );
}
