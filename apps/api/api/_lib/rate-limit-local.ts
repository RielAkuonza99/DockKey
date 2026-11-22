/** In-memory fixed-window limiter. Development only: not shared across serverless instances. */
export interface LocalBucket { count: number; resetAt: number }

export function checkLocalLimit(
  buckets: Map<string, LocalBucket>,
  key: string,
  limit: number,
  windowSeconds: number,
  now = Date.now()
): { allowed: boolean; retryAfter: number; remaining: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)), remaining: 0 };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0, remaining: limit - bucket.count };
}
