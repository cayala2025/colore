/** One bookable slot on a given day, as returned to the booking UI. */
export type DaySlot = {
  /** "HH:MM" studio local time. */
  start: string;
  end: string;
  capacity: number;
  seatsLeft: number;
};

/** What customers see for a slot: whether their party fits. Seat counts never leave the server. */
export type PublicSlot = {
  start: string;
  end: string;
  available: boolean;
};

/** Public availability for one day (GET /api/availability). */
export type PublicDay = {
  date: string;
  bookable: boolean;
  slots: PublicSlot[];
};

/** Availability for one calendar day (server-side, includes seat counts). */
export type DayAvailability = {
  date: string; // "YYYY-MM-DD"
  /** True when at least one slot fits the party and has not started. */
  bookable: boolean;
  /** Slots that have not started yet (including full ones). */
  slots: DaySlot[];
};

export type BookingStatus = "confirmed" | "cancelled" | "attended" | "no_show";
