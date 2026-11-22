import type { VercelRequest, VercelResponse } from "@vercel/node";

export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Frame-Options", "DENY");
}

export function applyCors(req: VercelRequest, res: VercelResponse) {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  // Native Android clients generally do not send Origin. Web origins can be
  // restricted through DOCKKEY_ALLOWED_ORIGINS (comma-separated).
  const allowed = (process.env.DOCKKEY_ALLOWED_ORIGINS ?? "").split(",").map(v => v.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Request-ID");
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } });
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.split(",")[0]?.trim();
  return trimmed || undefined;
}

/**
 * Vercel overwrites x-forwarded-for / x-real-ip with the connecting client IP, so
 * these are trustworthy there. Self-hosters behind other proxies must ensure
 * their proxy sets them.
 */
export function getClientIp(req: VercelRequest): string {
  return (
    firstHeader(req.headers["x-vercel-forwarded-for"]) ??
    firstHeader(req.headers["x-real-ip"]) ??
    firstHeader(req.headers["x-forwarded-for"]) ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}

export function errorResponse(res: VercelResponse, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}
