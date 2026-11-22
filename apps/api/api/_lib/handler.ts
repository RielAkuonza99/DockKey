import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ConfigError } from "./config.js";
import { applyCors, errorResponse, setSecurityHeaders } from "./http.js";
import { enforceRateLimit } from "./rate-limit.js";
import { callGenCipta, ProviderError } from "./provider.js";

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict();

export async function generatorHandler(req: VercelRequest, res: VercelResponse, action: "send" | "verify") {
  setSecurityHeaders(res);
  applyCors(req, res);
  try {
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST, OPTIONS");
      return errorResponse(res, 405, "METHOD_NOT_ALLOWED", "Gunakan POST untuk endpoint ini.");
    }
    if (!(await enforceRateLimit(req, res))) return;
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) return errorResponse(res, 400, "INVALID_EMAIL", "Masukkan alamat email yang valid.");
    const result = await callGenCipta(action, parsed.data.email);
    if (!result.success) return errorResponse(res, 502, "PROVIDER_REJECTED", result.message);
    return res.status(200).json({
      data: {
        success: true,
        email: result.email,
        message: result.message,
        ...(result.verificationUrl ? { verificationUrl: result.verificationUrl } : {}),
        ...(result.oobCode ? { oobCode: result.oobCode } : {})
      },
      meta: { action }
    });
  } catch (error) {
    if (error instanceof ConfigError) return errorResponse(res, 503, "BACKEND_MISCONFIGURED", "Backend belum dikonfigurasi dengan benar.");
    if (error instanceof ProviderError) return errorResponse(res, error.status, error.code, error.message);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Terjadi kesalahan internal.");
  }
}
