import { es } from "@/content/es";
import { addMonths, monthGrid, parseIsoDate } from "@/lib/calendar";

type Props = {
  month: string; // "YYYY-MM"
  minMonth: string;
  maxMonth: string;
  selected: string | null;
  isDisabled: (date: string) => boolean;
  onSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
};

export function CalendarStep({ month, minMonth, maxMonth, selected, isDisabled, onSelect, onMonthChange }: Props) {
  const { year, month: m } = parseIsoDate(`${month}-01`);
  const title = `${es.booking.date.months[m - 1]} ${year}`;
  const canPrev = month > minMonth;
  const canNext = month < maxMonth;
  const navClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl disabled:opacity-30";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={navClass}
          aria-label={es.booking.date.prevMonth}
          disabled={!canPrev}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ‹
        </button>
        <p className="font-medium capitalize" aria-live="polite">
          {title}
        </p>
        <button
          type="button"
          className={navClass}
          aria-label={es.booking.date.nextMonth}
          disabled={!canNext}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={title}>
        {es.booking.date.weekdaysShort.map((d, i) => (
          <div key={i} role="columnheader" className="pb-1 text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {monthGrid(month).map((date, i) => {
          if (!date) return <div key={`blank-${i}`} role="gridcell" />;
          const day = parseIsoDate(date).day;
          const disabled = isDisabled(date);
          const isSelected = selected === date;
          return (
            <div key={date} role="gridcell">
              <button
                type="button"
                data-date={date}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={disabled ? `${day} · ${es.booking.date.unavailableDay}` : String(day)}
                onClick={() => onSelect(date)}
                className={`flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-accent text-accent-ink"
                    : disabled
                      ? "cursor-not-allowed text-disabled line-through"
                      : "hover:bg-accent-soft"
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
