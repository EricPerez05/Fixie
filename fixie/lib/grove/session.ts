import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RateLimitResult } from "@/lib/rate-limit";
import { ensureUser, type GroveFailure } from "./server";

export interface GroveSession {
  client: SupabaseClient;
  userId: string;
}

export type GroveSessionOutcome = { ok: true; session: GroveSession } | { ok: false; response: Response };

/**
 * The caller's Supabase session for a Grove route, signing them in
 * anonymously on first use. Fails with a ready response: 404 when Supabase
 * isn't configured (the client should be using its local Grove), 503 when
 * Supabase won't give us a user. Throws only on half-set Supabase env vars.
 */
export async function openGroveSession(): Promise<GroveSessionOutcome> {
  const env = getSupabaseEnv();
  if (!env) return { ok: false, response: Response.json({ error: "not_configured" }, { status: 404 }) };
  const client = await createSupabaseServerClient(env);
  const userId = await ensureUser(client);
  if (!userId) return { ok: false, response: Response.json({ error: "unavailable" }, { status: 503 }) };
  return { ok: true, session: { client, userId } };
}

const STATUS: Record<GroveFailure, number> = {
  unauthorized: 401,
  not_growable: 422,
  not_found: 404,
  server: 502,
};

/** Maps an expected Grove failure to its HTTP response. */
export function failureResponse(reason: GroveFailure): Response {
  return Response.json({ error: reason }, { status: STATUS[reason] });
}

/** The 429 every Grove route answers with once the caller is over GROVE_POLICY. */
export function rateLimitedResponse(limit: Extract<RateLimitResult, { ok: false }>): Response {
  return Response.json(
    { error: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
  );
}

// SECURITY: responses carry signed photo URLs and one user's data; no cache may keep them.
export const PRIVATE = { "Cache-Control": "private, no-store" } as const;
