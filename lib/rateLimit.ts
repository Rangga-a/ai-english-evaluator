type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Rate limiter sederhana berbasis sliding window per-key (biasanya per IP).
 *
 * @param identifier kunci unik, misal `writing:${ip}`
 * @param limit jumlah maksimum request yang diizinkan dalam windowMs
 * @param windowMs panjang window dalam milidetik
 */
export function rateLimit(
  identifier: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt < now) {
    buckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}