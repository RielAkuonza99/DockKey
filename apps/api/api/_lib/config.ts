import { z } from "zod";

const schema = z.object({
  APP_MODE: z.enum(["central", "selfhost"]).default("selfhost"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AM_API_KEY: z.string().default(""),
  AM_API_BASE_URL: z.string().url().default("https://am-api-service.vercel.app"),
  AM_API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(20000),
  UPSTASH_REDIS_REST_URL: z.string().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().default(""),
  RATE_LIMIT_REQUESTS: z.coerce.number().int().min(1).max(100).default(5),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3600).default(60)
});

export type AppConfig = z.infer<typeof schema> & { IS_PRODUCTION: boolean };

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

let cached: AppConfig | undefined;

/**
 * Lazily parsed so that an invalid environment produces a controlled 503 from
 * the handler instead of crashing the function at import time.
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env && cached) return cached;
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new ConfigError(`Konfigurasi backend tidak valid: ${keys}`);
  }
  // Vercel always sets VERCEL; treat any Vercel deployment as production for rate-limit safety.
  const config: AppConfig = { ...parsed.data, IS_PRODUCTION: parsed.data.NODE_ENV === "production" || Boolean(env.VERCEL) };
  if (env === process.env) cached = config;
  return config;
}

export function resetConfigCache() {
  cached = undefined;
}
