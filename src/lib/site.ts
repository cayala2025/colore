/** Public base URL (no trailing slash). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function manageUrl(token: string): string {
  return `${siteUrl()}/r/${token}`;
}
