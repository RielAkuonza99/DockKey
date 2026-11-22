import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { resetConfigCache } from "../api/_lib/config.js";
import { generatorHandler } from "../api/_lib/handler.js";

type Captured = { status: number; headers: Record<string, string>; body: unknown };

function mockRes() {
  const out: Captured = { status: 0, headers: {}, body: undefined };
  const res = {
    setHeader(k: string, v: string) { out.headers[k.toLowerCase()] = v; return res; },
    status(code: number) { out.status = code; return res; },
    json(body: unknown) { out.body = body; return res; },
    end() { return res; }
  };
  return { res: res as never, out };
}
const req = (method: string, body?: unknown, ip = "1.1.1.1") =>
  ({ method, body, headers: { "x-real-ip": ip }, socket: {} }) as never;

const saved = { ...process.env };
const realFetch = globalThis.fetch;

beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: "test", GENCIPTA_API_KEY: "k", GENCIPTA_API_KEY_HEADER: "x-api-key",
    GENCIPTA_BASE_URL: "https://gw.test", GENCIPTA_SEND_PATH: "/send", GENCIPTA_VERIFY_PATH: "/verify",
    RATE_LIMIT_REQUESTS: "2", RATE_LIMIT_WINDOW_SECONDS: "60"
  });
  delete process.env.VERCEL; delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  resetConfigCache();
});
afterEach(() => { process.env = { ...saved }; globalThis.fetch = realFetch; resetConfigCache(); });

describe("generatorHandler", () => {
  it("rejects non-POST", async () => {
    const { res, out } = mockRes();
    await generatorHandler(req("GET"), res, "send");
    assert.equal(out.status, 405);
  });
  it("rejects invalid email", async () => {
    const { res, out } = mockRes();
    await generatorHandler(req("POST", { email: "nope" }, "2.2.2.2"), res, "send");
    assert.equal(out.status, 400);
  });
  it("calls the provider and returns a normalized response", async () => {
    let seen: { url?: string; init?: RequestInit } = {};
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ success: true, message: "ok", secretField: "x" }), { status: 200, headers: { "content-type": "application/json" } });
    }) as never;
    const { res, out } = mockRes();
    await generatorHandler(req("POST", { email: "User@Example.com" }, "3.3.3.3"), res, "send");
    assert.equal(out.status, 200);
    assert.equal(seen.url, "https://gw.test/send");
    assert.equal((seen.init?.headers as Record<string, string>)["x-api-key"], "k");
    assert.deepEqual(out.body, { data: { success: true, status: "accepted", email: "user@example.com", message: "ok" }, meta: { action: "send" } });
  });
  it("enforces rate limits", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } })) as never;
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { res, out } = mockRes();
      await generatorHandler(req("POST", { email: "a@b.co" }, "4.4.4.4"), res, "send");
      statuses.push(out.status);
    }
    assert.deepEqual(statuses, [200, 200, 429]);
  });
  it("fails closed in production without Upstash", async () => {
    process.env.NODE_ENV = "production"; resetConfigCache();
    const { res, out } = mockRes();
    await generatorHandler(req("POST", { email: "a@b.co" }, "5.5.5.5"), res, "send");
    assert.equal(out.status, 503);
    assert.equal((out.body as { error: { code: string } }).error.code, "RATE_LIMIT_NOT_CONFIGURED");
  });
  it("does not leak provider auth failures", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ message: "bad key k" }), { status: 401, headers: { "content-type": "application/json" } })) as never;
    const { res, out } = mockRes();
    await generatorHandler(req("POST", { email: "a@b.co" }, "6.6.6.6"), res, "verify");
    assert.equal(out.status, 502);
    assert.ok(!JSON.stringify(out.body).includes("bad key"));
  });
  it("returns 503 when provider auth is not configured", async () => {
    process.env.GENCIPTA_API_KEY_HEADER = ""; resetConfigCache();
    const { res, out } = mockRes();
    await generatorHandler(req("POST", { email: "a@b.co" }, "7.7.7.7"), res, "send");
    assert.equal(out.status, 503);
  });
});
