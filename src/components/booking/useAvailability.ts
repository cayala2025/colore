"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicDay } from "@/lib/types";

type Entry = { days?: PublicDay[]; error?: boolean };

/**
 * Fetches /api/availability for each month in `months` (for the given party),
 * cached per month + party. Returns a lookup by date plus the state of `months[0]`.
 */
export function useAvailability(party: number | null, months: string[]) {
  const [cache, setCache] = useState<Record<string, Entry>>({});
  const inflight = useRef(new Set<string>());
  const [version, setVersion] = useState(0);
  const monthsKey = [...new Set(months)].join(",");

  useEffect(() => {
    if (!party) return;
    for (const month of monthsKey.split(",")) {
      const key = `${month}|${party}`;
      if (cache[key] || inflight.current.has(key)) continue;
      inflight.current.add(key);
      fetch(`/api/availability?month=${month}&party=${party}`, { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          const body = (await res.json()) as { days: PublicDay[] };
          setCache((c) => ({ ...c, [key]: { days: body.days } }));
        })
        .catch(() => setCache((c) => ({ ...c, [key]: { error: true } })))
        .finally(() => inflight.current.delete(key));
    }
  }, [party, monthsKey, cache, version]);

  const day = useCallback(
    (date: string): PublicDay | undefined =>
      party ? cache[`${date.slice(0, 7)}|${party}`]?.days?.find((d) => d.date === date) : undefined,
    [cache, party],
  );

  const current = party ? cache[`${months[0]}|${party}`] : undefined;

  /** true/false once the month is loaded; null while unknown. */
  const monthHasBookableDay = useCallback(
    (month: string): boolean | null => {
      const days = party ? cache[`${month}|${party}`]?.days : undefined;
      return days ? days.some((d) => d.bookable) : null;
    },
    [cache, party],
  );

  /** Drop cached data and fetch again (e.g. after "slot just filled"). */
  const reload = useCallback(() => {
    setCache({});
    setVersion((v) => v + 1);
  }, []);

  return {
    day,
    monthHasBookableDay,
    loading: Boolean(party) && !current,
    error: Boolean(current?.error),
    reload,
  };
}
