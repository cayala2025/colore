import { describe, expect, it } from "vitest";
import { groupBookingsBySlot, type AdminBooking } from "./daySlots";

const schedule = [
  { weekday: 4, start_time: "11:00:00", end_time: "13:00:00", capacity: 30, active: true },
  { weekday: 4, start_time: "16:00:00", end_time: "18:00:00", capacity: 30, active: true },
  { weekday: 4, start_time: "20:00:00", end_time: "22:00:00", capacity: 30, active: false },
];

const b = (name: string, start: string, party: number, status: AdminBooking["status"] = "confirmed"): AdminBooking => ({
  id: name,
  name,
  phone: "+526860000000",
  email: "x@example.com",
  party_size: party,
  status,
  start_time: start,
  end_time: "18:00:00",
  customer_confirmed_at: null,
  manage_token: "t",
  date: "2026-10-08",
});

describe("groupBookingsBySlot", () => {
  it("counts used/free seats per active slot; cancelled/no-show don't count", () => {
    const slots = groupBookingsBySlot(schedule, [
      b("Zoe", "16:00:00", 4),
      b("Ana", "16:00:00", 2, "attended"),
      b("Luis", "16:00:00", 8, "cancelled"),
      b("Eva", "16:00:00", 3, "no_show"),
    ]);
    expect(slots.map((s) => s.start)).toEqual(["11:00", "16:00"]);
    expect(slots[1]).toMatchObject({ used: 6, free: 24, capacity: 30 });
    expect(slots[1].bookings.map((x) => x.name)).toEqual(["Ana", "Zoe", "Eva", "Luis"]);
    expect(slots[0]).toMatchObject({ used: 0, free: 30, bookings: [] });
  });

  it("keeps bookings whose time is no longer in the schedule", () => {
    const slots = groupBookingsBySlot(schedule, [b("Ana", "20:00:00", 2)]);
    expect(slots.at(-1)).toMatchObject({ start: "20:00", offSchedule: true, used: 2 });
  });
});
