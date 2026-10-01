// Tiny in-memory fixed-window rate limiter. Per server instance only (best effort on serverless).

type Window = { start: number; count: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, Window>();
  return function allow(key: string, now = Date.now()): boolean {
    const w = hits.get(key);
    if (!w || now - w.start >= windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 5000) hits.clear(); // keep memory bounded
      return true;
    }
    w.count += 1;
    return w.count <= limit;
  };
}
