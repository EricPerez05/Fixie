import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseEnv } from "@/lib/env";

/**
 * A Supabase client acting as the caller, with their session in cookies.
 * It uses the anon key, so every query runs under row-level security as
 * that user; nothing here can read another user's Grove.
 *
 * Only for route handlers: they are the one place Next lets us write the
 * refreshed session cookies back.
 */
export async function createSupabaseServerClient(env: SupabaseEnv): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
      },
    },
  });
}
