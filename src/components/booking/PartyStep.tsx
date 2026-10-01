import { WhatsAppLink } from "@/components/WhatsAppLink";
import { es } from "@/content/es";
import { MAX_ONLINE_PARTY } from "@/lib/bookingWindow";

type Props = {
  value: number | null;
  onChange: (n: number) => void;
};

export function PartyStep({ value, onChange }: Props) {
  const sizes = Array.from({ length: MAX_ONLINE_PARTY }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-4 gap-2">
      {sizes.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={selected}
            aria-label={es.booking.people.option(n)}
            onClick={() => onChange(n)}
            className={`h-12 rounded-xl border text-lg font-medium transition-colors ${
              selected
                ? "border-accent bg-accent text-accent-ink"
                : "border-line bg-bg hover:border-accent"
            }`}
          >
            {n}
          </button>
        );
      })}
      <WhatsAppLink
        text={es.booking.people.whatsappText}
        className="col-span-4 flex h-12 items-center justify-center rounded-xl border border-line bg-bg font-medium hover:border-accent"
      >
        {es.booking.people.more}
      </WhatsAppLink>
      <p className="col-span-4 text-xs text-muted">{es.booking.people.moreHint}</p>
    </div>
  );
}
