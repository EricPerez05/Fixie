import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpstashLimit, ratelimitConfigs } = vi.hoisted(() => ({
  mockUpstashLimit: vi.fn(),
  ratelimitConfigs: [] as unknown[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = vi.fn(() => "sliding-window");
    limit = mockUpstashLimit;
    constructor(config: unknown) {
      ratelimitConfigs.push(config);
    }
  }
  return { Ratelimit };
});

import { checkRateLimit, resetRateLimiterForTests, SCAN_LIMIT } from "@/lib/rate-limit";

function scanFrom(ip: string): Request {
  return new Request("http://localhost/api/scan", {
    method: "POST",
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

describe("checkRateLimit without Upstash (in-memory)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.useFakeTimers();
    resetRateLimiterForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it(`allows ${SCAN_LIMIT} scans a minute and blocks the next one`, async () => {
    for (let i = 0; i < SCAN_LIMIT; i++) {
      expect(await checkRateLimit(scanFrom("1.2.3.4"))).toEqual({ ok: true });
    }
    const blocked = await checkRateLimit(scanFrom("1.2.3.4"));
    expect(blocked.ok).toBe(false);
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("limits each IP separately", async () => {
    for (let i = 0; i < SCAN_LIMIT; i++) await checkRateLimit(scanFrom("1.2.3.4"));
    expect(await checkRateLimit(scanFrom("5.6.7.8"))).toEqual({ ok: true });
  });

  it("lets the IP scan again once the window has passed", async () => {
    for (let i = 0; i <= SCAN_LIMIT; i++) await checkRateLimit(scanFrom("1.2.3.4"));
    vi.advanceTimersByTime(60_001);
    expect(await checkRateLimit(scanFrom("1.2.3.4"))).toEqual({ ok: true });
  });
});

describe("checkRateLimit with Upstash", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    mockUpstashLimit.mockReset();
    ratelimitConfigs.length = 0;
    resetRateLimiterForTests();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reports how long to wait when Upstash says no", async () => {
    mockUpstashLimit.mockResolvedValue({ success: false, reset: Date.now() + 30_000 });
    const result = await checkRateLimit(scanFrom("1.2.3.4"));
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.retryAfterSeconds).toBeGreaterThanOrEqual(29);
  });

  it("keys Redis by a hash of the IP, never the raw address", async () => {
    mockUpstashLimit.mockResolvedValue({ success: true, reset: Date.now() });
    await checkRateLimit(scanFrom("1.2.3.4"));
    const identifier = mockUpstashLimit.mock.calls[0][0] as string;
    expect(identifier).not.toContain("1.2.3.4");
    expect(identifier).toMatch(/^[0-9a-f]{32}$/);
  });

  it("lets the scan through when Upstash errors, so a Redis outage can't stop the demo", async () => {
    mockUpstashLimit.mockRejectedValue(new Error("ECONNRESET"));
    expect(await checkRateLimit(scanFrom("1.2.3.4"))).toEqual({ ok: true });
  });

  it("throws on a half-configured deploy instead of silently running without Redis", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    resetRateLimiterForTests();
    await expect(checkRateLimit(scanFrom("1.2.3.4"))).rejects.toThrow(/UPSTASH_REDIS_REST_TOKEN/);
  });
});
