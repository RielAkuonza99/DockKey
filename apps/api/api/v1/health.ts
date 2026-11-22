import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use GET" } });
  }
  // Booleans only: never reveal secret values.
  const env = process.env;
  return res.status(200).json({
    data: {
      status: "ok",
      service: "dockkey-api",
      version: "1.0.0",
      mode: env.APP_MODE === "central" ? "central" : "selfhost",
      configured: {
        provider: Boolean(env.GENCIPTA_API_KEY && env.GENCIPTA_API_KEY_HEADER && env.GENCIPTA_VERIFY_PATH),
        rateLimit: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
      }
    }
  });
}
