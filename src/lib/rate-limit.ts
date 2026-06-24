import "server-only";

type Bucket = { tokens: number; lastRefillMs: number };

const BUCKETS = new Map<string, Bucket>();
const MAX_KEYS = 5000;

function gcIfNeeded(nowMs: number, retentionMs: number) {
  if (BUCKETS.size < MAX_KEYS) return;
  for (const [k, b] of BUCKETS) {
    if (nowMs - b.lastRefillMs > retentionMs) BUCKETS.delete(k);
  }
}

export type RateLimitOpts = {
  /** Max tokens (== burst capacity). */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSec: number;
};

/**
 * Best-effort token-bucket rate limiter, keyed by an arbitrary string (usually
 * the caller IP). Returns `{ ok: true }` if the request fits in the budget,
 * otherwise `{ ok: false, retryAfterMs }`.
 *
 * In-memory only — survives within a single serverless instance and resets on
 * cold start. Adequate as a baseline DoS / spray guard; for stricter limits in
 * production switch to Upstash / Vercel KV.
 */
export function rateLimit(
  key: string,
  opts: RateLimitOpts,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  gcIfNeeded(now, 60 * 60 * 1000);

  const bucket = BUCKETS.get(key) ?? { tokens: opts.capacity, lastRefillMs: now };
  const elapsedSec = (now - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(
    opts.capacity,
    bucket.tokens + elapsedSec * opts.refillPerSec,
  );
  bucket.lastRefillMs = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    BUCKETS.set(key, bucket);
    return { ok: true };
  }

  const need = 1 - bucket.tokens;
  const retryAfterMs = Math.ceil((need / opts.refillPerSec) * 1000);
  BUCKETS.set(key, bucket);
  return { ok: false, retryAfterMs };
}

/**
 * Best-effort caller IP from a NextRequest. Reads `x-forwarded-for` (Vercel
 * sets this), falling back to `x-real-ip`. Returns `"unknown"` if neither is
 * present so rate-limiting still applies (single shared bucket — degrades to
 * a strict cap rather than failing open).
 */
export function clientIp(req: { headers: Headers }): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Server-action variant of {@link clientIp}: reads the same headers via
 * `next/headers`. Must be called from a "use server" action or server
 * component — calling from a client component throws.
 */
export async function serverActionIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
