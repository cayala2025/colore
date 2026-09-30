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
  slots: DaySlot[];
};
