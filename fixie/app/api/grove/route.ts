import { GroveLogRequest } from "@/lib/grove/entries";
import { createEntry, listEntries } from "@/lib/grove/server";
import { failureResponse, openGroveSession, PRIVATE, rateLimitedResponse } from "@/lib/grove/session";
import { checkRateLimit, GROVE_POLICY } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";

/** The caller's Grove, oldest first, with short-lived signed photo URLs. */
export async function GET(req: Request): Promise<Response> {
  const limit = await checkRateLimit(req, GROVE_POLICY);
  if (!limit.ok) return rateLimitedResponse(limit);

  const opened = await openGroveSession();
  if (!opened.ok) return opened.response;

  const outcome = await listEntries(opened.session.client);
  if (!outcome.ok) return failureResponse(outcome.reason);
  return Response.json({ entries: outcome.value }, { headers: PRIVATE });
}

/** Logs a result (and optionally its photo thumbnail) to the caller's Grove. */
export async function POST(req: Request): Promise<Response> {
  // SECURITY: rate-limit before parsing or signing anyone in.
  const limit = await checkRateLimit(req, GROVE_POLICY);
  if (!limit.ok) return rateLimitedResponse(limit);

  const parsed = GroveLogRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const opened = await openGroveSession();
  if (!opened.ok) return opened.response;

  const started = Date.now();
  const outcome = await createEntry(opened.session.client, opened.session.userId, parsed.data);
  if (!outcome.ok) return failureResponse(outcome.reason);
  // Outcome and timing only: never the photo, the result text or the signed URL.
  log.info("grove.logged", {
    fairy: outcome.value.result.fairy,
    hasPhoto: outcome.value.hasPhoto ?? false,
    ms: Date.now() - started,
  });
  return Response.json({ entry: outcome.value }, { status: 201, headers: PRIVATE });
}
