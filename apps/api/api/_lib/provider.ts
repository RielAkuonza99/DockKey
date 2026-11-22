import { getConfig } from "./config.js";
import { buildProviderRequest, mapProviderFailure, normalizeProviderResponse, ProviderError, type ProviderAction, type ProviderResult } from "./provider-core.js";

export { ProviderError };
export type { ProviderResult };

export async function callAmApi(action: ProviderAction, email: string, magicLink?: string): Promise<ProviderResult> {
  const config = getConfig();
  const request = buildProviderRequest(config, action, email, magicLink);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.AM_API_TIMEOUT_MS);
  try {
    const response = await fetch(request.url, { method: "POST", headers: request.headers, body: request.body, signal: controller.signal, redirect: "error" });
    const contentType = response.headers.get("content-type") ?? "";
    const raw: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
    if (!response.ok) throw mapProviderFailure(response.status, raw, config.AM_API_KEY);
    const result = normalizeProviderResponse(action, email, raw, config.AM_API_KEY);
    if (!result.success) throw new ProviderError(502, "PROVIDER_REJECTED", result.message);
    return result;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ProviderError(504, "PROVIDER_TIMEOUT", "Provider tidak merespons dalam batas waktu.");
    throw new ProviderError(502, "PROVIDER_UNAVAILABLE", "Tidak dapat terhubung ke layanan provider.");
  } finally { clearTimeout(timeout); }
}
