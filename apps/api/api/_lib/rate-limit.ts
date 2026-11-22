import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getConfig } from "./config.js";
import { getClientIp, errorResponse } from "./http.js";
import { checkLocalLimit, type LocalBucket } from "./rate-limit-local.js";

let limiter: Ratelimit | undefined;
const localBuckets = new Map<string, LocalBucket>();

function getLimiter() {
  const config = getConfig();
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) return undefined;
  if (!limiter) {
    const redis = new Redis({ url: config.UPSTASH_REDIS_REST_URL, token: config.UPSTASH_REDIS_REST_TOKEN });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.RATE_LIMIT_REQUESTS, `${config.RATE_LIMIT_WINDOW_SECONDS} s`),
      prefix: "dockkey:api",
      analytics: false
    });
  }
  return limiter;
}

export async function enforceRateLimit(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const config = getConfig();
  const ip = getClientIp(req);
  const distributed = getLimiter();
  if (distributed) {
    try {
      const result = await distributed.limit(ip);
      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      if (!result.success) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))));
        errorResponse(res, 429, "RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar.");
        return false;
      }
      return true;
    } catch {
      errorResponse(res, 503, "RATE_LIMIT_UNAVAILABLE", "Proteksi penggunaan sedang tidak tersedia.");
      return false;
    }
  }

  if (config.IS_PRODUCTION) {
    errorResponse(res, 503, "RATE_LIMIT_NOT_CONFIGURED", "Backend belum dikonfigurasi dengan penyimpanan rate limit.");
    return false;
  }

  const local = checkLocalLimit(localBuckets, ip, config.RATE_LIMIT_REQUESTS, config.RATE_LIMIT_WINDOW_SECONDS);
  if (!local.allowed) {
    res.setHeader("Retry-After", String(local.retryAfter));
    errorResponse(res, 429, "RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi sebentar.");
    return false;
  }
  return true;
}
