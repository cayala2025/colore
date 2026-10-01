/** One bookable slot on a given day, as returned to the booking UI. */
export type DaySlot = {
  /** "HH:MM" studio local time. */
  start: string;
  end: string;
  capacity: number;
  seatsLeft: number;
};

/** Availability for one calendar day. */
export type DayAvailability = {
  date: string; // "YYYY-MM-DD"
  /** True when at least one slot fits the party and has not started. */
  bookable: boolean;
  /** Slots that have not started yet (including full ones, shown as "Lleno"). */
  slots: DaySlot[];
};

export type BookingStatus = "confirmed" | "cancelled" | "attended" | "no_show";
