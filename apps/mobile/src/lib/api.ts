const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

type ApiEnvelope<T> = { data: T; meta?: { action?: string } };
type ApiFailure = { error?: { code?: string; message?: string } };
export type GeneratorResult = { success: boolean; email: string; message: string; verificationUrl?: string; oobCode?: string };

const REQUEST_TIMEOUT_MS = 25000;

export class ApiError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

function isAllowedBaseUrl(url: string) {
  // HTTPS everywhere; plain HTTP is only tolerated for local development hosts.
  return /^https:\/\//i.test(url) || (__DEV__ && /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?/i.test(url));
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("Alamat backend belum dikonfigurasi. Atur EXPO_PUBLIC_API_BASE_URL saat build.", "NOT_CONFIGURED");
  if (!isAllowedBaseUrl(API_BASE_URL)) throw new ApiError("Alamat backend harus menggunakan HTTPS.", "INSECURE_BASE_URL");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers }
    });
    const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & ApiFailure;
    if (!response.ok) {
      const fallback = response.status === 429 ? "Terlalu banyak permintaan. Coba lagi sebentar." : `Permintaan gagal (${response.status}).`;
      throw new ApiError(body.error?.message ?? fallback, body.error?.code, response.status);
    }
    if (body.data === undefined) throw new ApiError("Respons server tidak valid.", "INVALID_RESPONSE", response.status);
    return body.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ApiError("Koneksi timeout. Periksa internet lalu coba lagi.", "TIMEOUT");
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi internet.", "NETWORK");
  } finally {
    clearTimeout(timeout);
  }
}

export function sendVerificationEmail(email: string) {
  return apiRequest<GeneratorResult>("/api/v1/generate", { method: "POST", body: JSON.stringify({ email }) });
}

export function verifyEmail(email: string) {
  return apiRequest<GeneratorResult>("/api/v1/verify", { method: "POST", body: JSON.stringify({ email }) });
}

export async function checkApiHealth() {
  return apiRequest<{ status: string; service: string; version: string; mode: string }>("/api/v1/health", { method: "GET" });
}
