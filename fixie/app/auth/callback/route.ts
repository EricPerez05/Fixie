import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Where Google sends people back after "Sign in with Google". Exchanges the
 * one-time PKCE code for a session cookie, then redirects to the Home tab. Any failure
 * (cancelled sign-in, missing or reused code, Supabase down) also redirects
 * there, with ?signin=failed so the app can say so. Never throws.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // SECURITY: always this origin's Home tab, where sign-in starts; never a
  // redirect target taken from the query.
  const home = new URL("/?view=account", url.origin);
  if (!code) {
    // Linking an anonymous visitor to a Google account that's already in use
    // comes back with this code instead; the app then offers a plain sign-in.
    const errorCode = url.searchParams.get("error_code");
    return failed(home, errorCode ?? "missing_code", errorCode === "identity_already_exists" ? "taken" : "failed");
  }

  try {
    // Throws only when the Supabase env vars are half set: a broken deploy, reported as a failed sign-in.
    const env = getSupabaseEnv();
    if (!env) return failed(home, "not_configured");
    const supabase = await createSupabaseServerClient(env);
    const flowId = url.searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (error) return failed(home, error.code ?? error.name);
  } catch (error) {
    return failed(home, error instanceof Error ? error.name : "Unknown");
  }
  return NextResponse.redirect(home);
}

function failed(home: URL, reason: string, outcome: "failed" | "taken" = "failed"): Response {
  // SECURITY: the reason is an error code, never the auth code or a token.
  log.warn("auth.callback_failed", { reason });
  const target = new URL(home);
  target.searchParams.set("signin", outcome);
  return NextResponse.redirect(target);
}
