/** Past no-shows per phone, not counting the booking being shown. */
export function noShowCount(
  history: { id: string; phone: string; status: string }[],
  booking: { id: string; phone: string },
): number {
  return history.filter((h) => h.phone === booking.phone && h.status === "no_show" && h.id !== booking.id).length;
}
