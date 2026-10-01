export type SlotInput = { start: string; end: string; capacity: number; active: boolean };
export type SlotErrorKey = "time" | "capacity";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validate a schedule slot edit. Returns an error key or null. */
export function validateSlotInput(input: SlotInput): SlotErrorKey | null {
  if (!TIME_RE.test(input.start) || !TIME_RE.test(input.end) || input.end <= input.start) return "time";
  if (!Number.isInteger(input.capacity) || input.capacity < 0 || input.capacity > 200) return "capacity";
  return null;
}
