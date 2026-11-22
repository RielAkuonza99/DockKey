import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ConfigError } from "./config.js";
import { applyCors, errorResponse, setSecurityHeaders } from "./http.js";
import { enforceRateLimit } from "./rate-limit.js";
import { callAmApi, ProviderError } from "./provider.js";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), magicLink: z.string().trim().url().optional() }).strict();

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
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return errorResponse(res, 400, "INVALID_REQUEST", "Periksa alamat email dan data permintaan.");
    if (action === "verify" && !parsed.data.magicLink) return errorResponse(res, 400, "MAGIC_LINK_REQUIRED", "Tempel magic link dari email Alight Motion.");
    const result = await callAmApi(action, parsed.data.email, parsed.data.magicLink);
    if (!result.success) return errorResponse(res, 502, "PROVIDER_REJECTED", result.message);
    return res.status(200).json({
      data: {
        success: true,
        status: result.status,
        email: result.email,
        message: result.message
      },
      meta: { action }
    });
  } catch (error) {
    if (error instanceof ConfigError) return errorResponse(res, 503, "BACKEND_MISCONFIGURED", "Backend belum dikonfigurasi dengan benar.");
    if (error instanceof ProviderError) return errorResponse(res, error.status, error.code, error.message);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Terjadi kesalahan internal.");
  }
}
