import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProviderRequest, mapProviderFailure, normalizeProviderResponse, ProviderError, type ProviderSettings } from "../api/_lib/provider-core.js";
import { checkLocalLimit } from "../api/_lib/rate-limit-local.js";

const base: ProviderSettings = { AM_API_KEY: "secret-key", AM_API_BASE_URL: "https://am-api-service.vercel.app" };

describe("buildProviderRequest", () => {
  it("builds the documented send-link JSON body", () => {
    const r = buildProviderRequest(base, "send", "a@b.co");
    assert.equal(r.url, "https://am-api-service.vercel.app/api/alightmotion/send-link");
    assert.equal(r.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(r.body), { email: "a@b.co", apiKey: "secret-key" });
    assert.equal(r.headers["x-api-key"], undefined);
  });
  it("builds the documented verify-link body including magicLink", () => {
    const r = buildProviderRequest(base, "verify", "a@b.co", "https://alight.link/verify?id=123");
    assert.equal(r.url, "https://am-api-service.vercel.app/api/alightmotion/verify-link");
    assert.deepEqual(JSON.parse(r.body), { email: "a@b.co", magicLink: "https://alight.link/verify?id=123", apiKey: "secret-key" });
  });
  it("requires a key and HTTPS magic link", () => {
    assert.throws(() => buildProviderRequest({ ...base, AM_API_KEY: "" }, "send", "a@b.co"), (e: unknown) => e instanceof ProviderError && e.code === "PROVIDER_NOT_CONFIGURED");
    assert.throws(() => buildProviderRequest(base, "verify", "a@b.co"), (e: unknown) => e instanceof ProviderError && e.code === "INVALID_MAGIC_LINK");
    assert.throws(() => buildProviderRequest(base, "verify", "a@b.co", "javascript:alert(1)"), ProviderError);
  });
  it("rejects non-HTTPS provider endpoints", () => {
    assert.throws(() => buildProviderRequest({ ...base, AM_API_BASE_URL: "http://am-api-service.vercel.app" }, "send", "a@b.co"), ProviderError);
  });
});

describe("mapProviderFailure", () => {
  it("hides provider auth failure details", () => {
    const e = mapProviderFailure(401, { message: "Invalid key" });
    assert.equal(e.code, "PROVIDER_AUTH_FAILED");
    assert.ok(!e.message.includes("Invalid key"));
  });
  it("maps 429, 5xx and 4xx", () => {
    assert.equal(mapProviderFailure(429, {}).status, 429);
    assert.equal(mapProviderFailure(503, {}).code, "PROVIDER_UNAVAILABLE");
    const e = mapProviderFailure(422, { message: "Email tidak valid" });
    assert.equal(e.code, "PROVIDER_REQUEST_FAILED");
    assert.equal(e.message, "Email tidak valid");
  });
});

describe("normalizeProviderResponse", () => {
  it("does not leak provider session tokens", () => {
    const r = normalizeProviderResponse("verify", "a@b.co", { success: true, message: "verified", idToken: "secret-token", refreshToken: "refresh-secret" });
    assert.deepEqual(r, { success: true, status: "completed", email: "a@b.co", message: "verified" });
    assert.equal(JSON.stringify(r).includes("secret-token"), false);
  });
  it("detects explicit failure but accepts a normal 2xx payload", () => {
    assert.equal(normalizeProviderResponse("send", "a@b.co", { success: false, message: "gagal" }).success, false);
    assert.equal(normalizeProviderResponse("send", "a@b.co", { message: "sent" }).success, true);
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
