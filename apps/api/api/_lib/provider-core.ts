/**
 * Pure provider logic (no network, no zod) so it can be unit-tested offline.
 */
export type ProviderAction = "send" | "verify";

export class ProviderError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ProviderSettings {
  GENCIPTA_API_KEY: string;
  GENCIPTA_API_KEY_HEADER: string;
  GENCIPTA_API_KEY_PREFIX: string;
  GENCIPTA_BASE_URL: string;
  GENCIPTA_SEND_PATH: string;
  GENCIPTA_VERIFY_PATH: string;
  GENCIPTA_REQUEST_FORMAT: "json" | "form";
}

/**
 * accepted  - provider accepted a send request (no verification evidence exists yet)
 * pending   - verify call succeeded but returned no verification evidence
 * completed - verify call returned evidence (a https link or an oobCode)
 */
export type VerificationStatus = "accepted" | "pending" | "completed";

export interface ProviderResult {
  success: boolean;
  status: VerificationStatus;
  email: string;
  message: string;
  verificationUrl?: string;
  oobCode?: string;
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function buildProviderRequest(settings: ProviderSettings, action: ProviderAction, email: string): ProviderRequest {
  if (!settings.GENCIPTA_API_KEY) {
    throw new ProviderError(503, "PROVIDER_NOT_CONFIGURED", "GenCipta API Key belum dikonfigurasi di backend.");
  }
  if (!settings.GENCIPTA_API_KEY_HEADER) {
    throw new ProviderError(503, "PROVIDER_AUTH_NOT_CONFIGURED", "Header autentikasi GenCipta belum dikonfigurasi di backend.");
  }
  const path = action === "send" ? settings.GENCIPTA_SEND_PATH : settings.GENCIPTA_VERIFY_PATH;
  if (!path) {
    throw new ProviderError(503, "PROVIDER_ENDPOINT_NOT_CONFIGURED", "Endpoint provider untuk aksi ini belum dikonfigurasi di backend.");
  }
  let url: URL;
  try {
    url = new URL(path, settings.GENCIPTA_BASE_URL);
  } catch {
    throw new ProviderError(503, "PROVIDER_ENDPOINT_NOT_CONFIGURED", "Endpoint provider tidak valid.");
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new ProviderError(503, "PROVIDER_ENDPOINT_NOT_CONFIGURED", "Endpoint provider harus menggunakan HTTPS.");
  }
  const json = settings.GENCIPTA_REQUEST_FORMAT === "json";
  return {
    url: url.toString(),
    headers: {
      Accept: "application/json",
      "Content-Type": json ? "application/json" : "application/x-www-form-urlencoded",
      [settings.GENCIPTA_API_KEY_HEADER]: `${settings.GENCIPTA_API_KEY_PREFIX}${settings.GENCIPTA_API_KEY}`
    },
    body: json ? JSON.stringify({ email }) : new URLSearchParams({ email }).toString()
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function safeMessage(value: unknown, secret: string): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  let text = value.trim().slice(0, 200);
  if (secret) text = text.split(secret).join("[redacted]");
  return text;
}

/** Maps a non-2xx provider response to a sanitized client-facing error. */
export function mapProviderFailure(status: number, raw: unknown, secret = ""): ProviderError {
  if (status === 401 || status === 403) {
    // Never forward auth failure details: they describe the operator's credentials.
    return new ProviderError(502, "PROVIDER_AUTH_FAILED", "Layanan provider menolak kredensial backend. Hubungi operator.");
  }
  if (status === 429) {
    return new ProviderError(429, "PROVIDER_QUOTA_OR_RATE_LIMIT", "Kuota atau batas permintaan provider tercapai. Coba lagi nanti.");
  }
  if (status >= 500) {
    return new ProviderError(502, "PROVIDER_UNAVAILABLE", "Layanan provider sedang bermasalah. Coba lagi nanti.");
  }
  const record = asRecord(raw);
  const message = safeMessage(record.message, secret) ?? safeMessage(asRecord(record.error).message, secret) ?? "Provider menolak permintaan.";
  return new ProviderError(400, "PROVIDER_REQUEST_FAILED", message);
}

/** Extracts only recognized fields from a successful provider response. */
export function normalizeProviderResponse(action: ProviderAction, email: string, raw: unknown, secret = ""): ProviderResult {
  const record = asRecord(raw);
  const nested = asRecord(record.data);
  const success = record.success !== false && nested.success !== false;
  const message =
    safeMessage(record.message, secret) ??
    safeMessage(nested.message, secret) ??
    (action === "send" ? "Permintaan pengiriman email diterima provider." : "Permintaan verifikasi diterima provider.");
  const urls = [record.verificationUrl, record.verification_url, record.verification_link, record.link, record.url,
    nested.verificationUrl, nested.verification_url, nested.verification_link, nested.link, nested.url];
  const verificationUrl = urls.find((v): v is string => typeof v === "string" && /^https:\/\//i.test(v));
  const codes = [record.oobCode, record.oob_code, nested.oobCode, nested.oob_code];
  const oobCode = codes.find((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 2048);
  const hasEvidence = action === "verify" && Boolean(verificationUrl || oobCode);
  // HTTP 200 alone is never proof of completion. Only documented evidence
  // (verification link or oobCode) marks a verification as completed.
  const status: VerificationStatus = action === "send" ? "accepted" : hasEvidence ? "completed" : "pending";
  return {
    success,
    status,
    email,
    message,
    ...(action === "verify" && verificationUrl ? { verificationUrl } : {}),
    ...(action === "verify" && oobCode ? { oobCode } : {})
  };
}
