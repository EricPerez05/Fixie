import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getSupabaseEnv } = await import("@/lib/env");

function env(vars: Record<string, string>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...vars };
}

describe("getSupabaseEnv", () => {
  it("returns null when Supabase isn't configured, so the Grove stays local", () => {
    expect(getSupabaseEnv(env({}))).toBeNull();
    expect(getSupabaseEnv(env({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }))).toBeNull();
  });

  it("reads both values when both are set", () => {
    expect(
      getSupabaseEnv(env({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" })),
    ).toEqual({ url: "https://abc.supabase.co", anonKey: "anon" });
  });

  it("throws naming the missing key, never a value, when only one is set", () => {
    expect(() => getSupabaseEnv(env({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }))).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
    expect(() => getSupabaseEnv(env({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "secret-anon" }))).toThrow(/^(?!.*secret-anon)/);
  });

  it("rejects a malformed URL", () => {
    expect(() => getSupabaseEnv(env({ NEXT_PUBLIC_SUPABASE_URL: "not a url", NEXT_PUBLIC_SUPABASE_ANON_KEY: "a" }))).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});
