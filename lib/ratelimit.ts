/**
 * Rate limit sederhana di memori (satu instance server).
 * Produksi: ganti dengan Upstash Redis (@upstash/ratelimit), §5.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e || e.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  e.count += 1;
  return { ok: e.count <= limit, retryAfterMs: e.resetAt - now };
}

export function isLimited(key: string, limit: number): boolean {
  const e = buckets.get(key);
  return !!e && e.resetAt > Date.now() && e.count >= limit;
}

export function reset(key: string) {
  buckets.delete(key);
}
