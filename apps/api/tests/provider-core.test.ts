import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProviderRequest,
  mapProviderFailure,
  normalizeProviderResponse,
  ProviderError,
  type ProviderSettings
} from "../api/_lib/provider-core.js";
import { checkLocalLimit } from "../api/_lib/rate-limit-local.js";

const base: ProviderSettings = {
  GENCIPTA_API_KEY: "sekret-123",
  GENCIPTA_API_KEY_HEADER: "x-api-key",
  GENCIPTA_API_KEY_PREFIX: "",
  GENCIPTA_BASE_URL: "https://gateway.example.test",
  GENCIPTA_SEND_PATH: "/send",
  GENCIPTA_VERIFY_PATH: "/verify",
  GENCIPTA_REQUEST_FORMAT: "json"
};

describe("buildProviderRequest", () => {
  it("builds a JSON request with the configured auth header", () => {
    const r = buildProviderRequest(base, "send", "a@b.co");
    assert.equal(r.url, "https://gateway.example.test/send");
    assert.equal(r.headers["x-api-key"], "sekret-123");
    assert.equal(r.headers["Content-Type"], "application/json");
    assert.equal(r.body, JSON.stringify({ email: "a@b.co" }));
  });
  it("applies key prefix and form encoding", () => {
    const r = buildProviderRequest({ ...base, GENCIPTA_API_KEY_HEADER: "Authorization", GENCIPTA_API_KEY_PREFIX: "Bearer ", GENCIPTA_REQUEST_FORMAT: "form" }, "verify", "a+b@c.co");
    assert.equal(r.headers.Authorization, "Bearer sekret-123");
    assert.equal(r.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.equal(r.body, "email=a%2Bb%40c.co");
  });
  it("fails closed when the key, header or endpoint is missing", () => {
    for (const [patch, code] of [
      [{ GENCIPTA_API_KEY: "" }, "PROVIDER_NOT_CONFIGURED"],
      [{ GENCIPTA_API_KEY_HEADER: "" }, "PROVIDER_AUTH_NOT_CONFIGURED"],
      [{ GENCIPTA_VERIFY_PATH: "" }, "PROVIDER_ENDPOINT_NOT_CONFIGURED"]
    ] as const) {
      assert.throws(() => buildProviderRequest({ ...base, ...patch }, "verify", "a@b.co"), (e: unknown) => e instanceof ProviderError && e.code === code && e.status === 503);
    }
  });
  it("rejects non-HTTPS provider endpoints", () => {
    assert.throws(() => buildProviderRequest({ ...base, GENCIPTA_BASE_URL: "http://gateway.example.test" }, "send", "a@b.co"), ProviderError);
  });
});

describe("mapProviderFailure", () => {
  it("hides provider auth failure details", () => {
    const e = mapProviderFailure(401, { message: "Invalid key sekret-123" }, "sekret-123");
    assert.equal(e.code, "PROVIDER_AUTH_FAILED");
    assert.ok(!e.message.includes("sekret"));
  });
  it("maps 429, 5xx and 4xx", () => {
    assert.equal(mapProviderFailure(429, {}).status, 429);
    assert.equal(mapProviderFailure(503, {}).code, "PROVIDER_UNAVAILABLE");
    const e = mapProviderFailure(422, { message: "Email tidak valid" });
    assert.equal(e.code, "PROVIDER_REQUEST_FAILED");
    assert.equal(e.message, "Email tidak valid");
  });
  it("redacts the secret from forwarded messages", () => {
    assert.ok(!mapProviderFailure(400, { message: "bad sekret-123 here" }, "sekret-123").message.includes("sekret-123"));
  });
});

describe("normalizeProviderResponse", () => {
  it("returns only recognized fields for verify", () => {
    const r = normalizeProviderResponse("verify", "a@b.co", { success: true, data: { link: "https://x.test/?oobCode=1", oob_code: "abc", leak: "no" }, token: "no" });
    assert.deepEqual(r, { success: true, email: "a@b.co", message: "Permintaan verifikasi diterima provider.", verificationUrl: "https://x.test/?oobCode=1", oobCode: "abc" });
  });
  it("ignores non-https links and does not expose links on send", () => {
    assert.equal(normalizeProviderResponse("verify", "a@b.co", { link: "javascript:alert(1)" }).verificationUrl, undefined);
    assert.equal(normalizeProviderResponse("send", "a@b.co", { link: "https://x.test", oobCode: "z" }).verificationUrl, undefined);
  });
  it("detects explicit provider failure", () => {
    assert.equal(normalizeProviderResponse("send", "a@b.co", { success: false, message: "gagal" }).success, false);
    assert.equal(normalizeProviderResponse("send", "a@b.co", "plain text").success, true);
  });
});

describe("checkLocalLimit", () => {
  it("blocks after the limit and resets after the window", () => {
    const buckets = new Map();
    for (let i = 0; i < 3; i++) assert.equal(checkLocalLimit(buckets, "ip", 3, 60, 1000).allowed, true);
    const blocked = checkLocalLimit(buckets, "ip", 3, 60, 2000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter >= 1);
    assert.equal(checkLocalLimit(buckets, "ip", 3, 60, 62000).allowed, true);
    assert.equal(checkLocalLimit(buckets, "other", 3, 60, 2000).allowed, true);
  });
});
