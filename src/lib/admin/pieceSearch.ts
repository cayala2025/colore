export type PieceQuery = {
  /** Exact code, e.g. "C-0042". */
  code?: string;
  /** Digits to look for inside the E.164 phone. */
  phoneDigits?: string;
  /** Sanitized name fragment (letters, spaces, accents only). */
  name?: string;
};

/** Turn what staff type at the counter into search terms. */
export function parsePieceQuery(raw: string): PieceQuery {
  const q = raw.trim();
  if (!q) return {};
  const query: PieceQuery = {};

  const code = q.match(/^c?-?\s*0*(\d{1,6})$/i);
  if (code) query.code = `C-${code[1].padStart(4, "0")}`;

  const digits = q.replace(/\D/g, "");
  if (digits.length >= 4 && !/[a-z]/i.test(q.replace(/^c-?/i, ""))) query.phoneDigits = digits;

  const name = q.replace(/[^\p{L}\s'.-]/gu, "").replace(/\s+/g, " ").trim();
  if (name.length >= 2 && !/^c-?$/i.test(name)) query.name = name;

  return query;
}

/** PostgREST `or` filter for the query, or null when there is nothing to search. */
export function pieceQueryFilter(q: PieceQuery): string | null {
  const parts: string[] = [];
  if (q.code) parts.push(`code.eq.${q.code}`);
  if (q.phoneDigits) parts.push(`phone.like.*${q.phoneDigits}*`);
  if (q.name) parts.push(`name.ilike.*${q.name}*`);
  return parts.length ? parts.join(",") : null;
}
