// Error codes returned by POST /api/bookings. Keys of es.booking.errors where shown to customers.
export type BookingApiError =
  | "invalid"
  | "turnstile"
  | "slotFull"
  | "phoneHasBooking"
  | "dateBlocked"
  | "slotStarted"
  | "generic";

/** Map a create_booking() exception message to an API error code. */
export function mapRpcError(message: string | undefined): BookingApiError {
  switch (message) {
    case "slot_full":
      return "slotFull";
    case "phone_has_booking":
      return "phoneHasBooking";
    case "date_blocked":
      return "dateBlocked";
    case "slot_started":
      return "slotStarted";
    case "invalid_party":
    case "invalid_phone":
    case "out_of_window":
    case "slot_not_found":
      return "invalid";
    default:
      return "generic";
  }
}

export function statusFor(error: BookingApiError): number {
  switch (error) {
    case "invalid":
      return 400;
    case "turnstile":
      return 403;
    case "generic":
      return 500;
    default:
      return 409;
  }
}
