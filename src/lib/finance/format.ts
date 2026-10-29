const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

/** Display only: "$1,234.50". Math always stays on raw numbers. */
export function formatMxn(amount: number): string {
  return mxn.format(amount);
}
