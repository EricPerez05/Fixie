import { z } from "zod";
import { deleteEntry } from "@/lib/grove/server";
import { failureResponse, openGroveSession, rateLimitedResponse } from "@/lib/grove/session";
import { checkRateLimit, GROVE_POLICY } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EntryId = z.uuid();

/** Deletes one of the caller's Grove entries and its photo. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/grove/[id]">): Promise<Response> {
  const limit = await checkRateLimit(req, GROVE_POLICY);
  if (!limit.ok) return rateLimitedResponse(limit);

  const id = EntryId.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const opened = await openGroveSession();
  if (!opened.ok) return opened.response;

  const outcome = await deleteEntry(opened.session.client, id.data);
  if (!outcome.ok) return failureResponse(outcome.reason);
  return new Response(null, { status: 204 });
}
