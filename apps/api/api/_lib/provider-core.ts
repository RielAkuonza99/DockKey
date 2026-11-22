/**
 * Pure adapter for the AM API Service gateway. No network or runtime dependencies.
 * Provider contract source: https://github.com/yanzyuyu/alightmotion-api
 */
export type ProviderAction = "send" | "verify";

export class ProviderError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ProviderSettings {
  AM_API_KEY: string;
  AM_API_BASE_URL: string;
}

export interface ProviderResult {
  success: boolean;
  status: "accepted" | "completed";
  email: string;
  message: string;
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function buildProviderRequest(settings: ProviderSettings, action: ProviderAction, email: string, magicLink?: string): ProviderRequest {
  if (!settings.AM_API_KEY) {
    throw new ProviderError(503, "PROVIDER_NOT_CONFIGURED", "AM API Key belum dikonfigurasi di backend.");
  }
  if (action === "verify" && (!magicLink || !/^https:\/\//i.test(magicLink))) {
    throw new ProviderError(400, "INVALID_MAGIC_LINK", "Masukkan tautan magic link HTTPS dari email Alight Motion.");
  }
  const path = action === "send" ? "/api/alightmotion/send-link" : "/api/alightmotion/verify-link";
  const url = new URL(path, settings.AM_API_BASE_URL);
  if (url.protocol !== "https:") {
    throw new ProviderError(503, "PROVIDER_ENDPOINT_NOT_CONFIGURED", "AM API harus menggunakan HTTPS.");
  }
  const payload = action === "send"
    ? { email, apiKey: settings.AM_API_KEY }
    : { email, magicLink, apiKey: settings.AM_API_KEY };
  return {
    url: url.toString(),
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeMessage(value: unknown, secret = ""): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const text = value.trim().slice(0, 200);
  return secret ? text.split(secret).join("[redacted]") : text;
}

export function mapProviderFailure(status: number, raw: unknown, secret = ""): ProviderError {
  if (status === 401 || status === 403) return new ProviderError(502, "PROVIDER_AUTH_FAILED", "AM API menolak API Key backend. Periksa kredensial provider.");
  if (status === 429) return new ProviderError(429, "PROVIDER_QUOTA_OR_RATE_LIMIT", "Kuota atau batas permintaan provider tercapai. Coba lagi nanti.");
  if (status >= 500) return new ProviderError(502, "PROVIDER_UNAVAILABLE", "Layanan provider sedang bermasalah. Coba lagi nanti.");
  const record = asRecord(raw);
  const nested = asRecord(record.error);
  const message = safeMessage(record.message, secret) ?? safeMessage(nested.message, secret) ?? "Provider menolak permintaan.";
  return new ProviderError(400, "PROVIDER_REQUEST_FAILED", message);
}

/**
 * Only expose a small, non-sensitive result. The verify endpoint returns session
 * tokens according to the provider client docs; those tokens must never reach the APK.
 */
export function normalizeProviderResponse(action: ProviderAction, email: string, raw: unknown, secret = ""): ProviderResult {
  const record = asRecord(raw);
  const nested = asRecord(record.data);
  const success = record.success !== false && nested.success !== false && record.status !== "error";
  const message = safeMessage(record.message, secret) ?? safeMessage(nested.message, secret) ??
    (action === "send" ? "Permintaan pengiriman magic link diterima provider." : "Magic link berhasil diproses provider.");
  return { success, status: action === "send" ? "accepted" : "completed", email, message };
}
