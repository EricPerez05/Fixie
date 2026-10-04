import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getUpstashEnv } from "@/lib/env";
import { log } from "@/lib/log";

// Brief §5: 10 scans a minute is more than a person scanning junk needs, and
// caps what one abuser can spend on vision calls.
export const SCAN_LIMIT = 10;
export const SCAN_WINDOW_MS = 60_000;

/** One named limit: `limit` requests per IP in a sliding `windowMs`. */
export interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

export const SCAN_POLICY: RateLimitPolicy = { name: "scan", limit: SCAN_LIMIT, windowMs: SCAN_WINDOW_MS };

// Grove reads and writes are cheap compared with a vision call, but each log
// stores a photo. 30 a minute covers moving a 30-branch local Grove up in
// one go and still caps how fast one IP can fill storage.
export const GROVE_POLICY: RateLimitPolicy = { name: "grove", limit: 30, windowMs: 60_000 };

// If Upstash is slow, let the scan through after this long rather than
// stalling every scan on stage. The Anthropic spend limit is the backstop.
const UPSTASH_TIMEOUT_MS = 1_000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

interface Limiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>;
}

/**
 * Sliding-window log kept in this server instance's memory. Used when
 * Upstash isn't configured: exact for `pnpm dev`, and on serverless it still
 * limits each warm instance, which beats no limit at all.
 */
function createMemoryLimiter({ limit, windowMs }: RateLimitPolicy): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(identifier) {
      const now = Date.now();
      const recent = (hits.get(identifier) ?? []).filter((at) => at > now - windowMs);
      const success = recent.length < limit;
      if (success) recent.push(now);
      hits.set(identifier, recent);
      // Keep memory bounded if many IPs pass through one instance.
      if (hits.size > 10_000) {
        for (const [key, times] of hits) {
          if (times.every((at) => at <= now - windowMs)) hits.delete(key);
        }
      }
      return { success, reset: (recent[0] ?? now) + windowMs };
    },
  };
}

function createUpstashLimiter(url: string, token: string, { name, limit, windowMs }: RateLimitPolicy): Limiter {
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
    prefix: `fixie:${name}`,
    timeout: UPSTASH_TIMEOUT_MS,
    analytics: false,
  });
}

// Created on first use rather than at import, so builds and tests that never
// scan don't need Upstash credentials. One per policy name.
const limiters = new Map<string, Limiter>();

function getLimiter(policy: RateLimitPolicy): Limiter {
  let limiter = limiters.get(policy.name);
  if (!limiter) {
    const upstash = getUpstashEnv();
    if (upstash) {
      limiter = createUpstashLimiter(upstash.url, upstash.token, policy);
    } else {
      log.warn("rate_limit.memory_fallback", { reason: "upstash_not_configured", policy: policy.name });
      limiter = createMemoryLimiter(policy);
    }
    limiters.set(policy.name, limiter);
  }
  return limiter;
}

/**
 * The caller's IP, hashed. On Vercel the platform overwrites
 * x-forwarded-for with the real client address, so it can't be spoofed
 * there. Requests with no address share one bucket.
 */
function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
  // PRIVACY: store a hash in Redis, never the raw IP.
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Checks whether this request's IP may make another request under `policy`
 * (scans by default). Returns { ok: false, retryAfterSeconds } once an IP
 * passes the policy's limit in its window. Never throws for limiter outages:
 * if Upstash errors, the request is allowed and the failure logged, so a
 * Redis blip can't take the demo down. Throws only on misconfigured Upstash
 * env vars.
 */
export async function checkRateLimit(req: Request, policy: RateLimitPolicy = SCAN_POLICY): Promise<RateLimitResult> {
  const activeLimiter = getLimiter(policy);
  try {
    const { success, reset } = await activeLimiter.limit(clientKey(req));
    if (success) return { ok: true };
    log.info("rate_limit.blocked", { policy: policy.name });
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    log.error("rate_limit.error", { reason: error instanceof Error ? error.name : "Unknown" });
    return { ok: true };
  }
}

/** Test-only: forget the cached limiters so env and clock changes take effect. */
export function resetRateLimiterForTests(): void {
  limiters.clear();
}
