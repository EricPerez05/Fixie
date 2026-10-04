import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccount } from "@/hooks/use-account";
import type { Preferences } from "@/lib/scan/schema";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    linkIdentity: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
}));
// A fake client, present only when the Supabase env vars are, like the real one.
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => (process.env.NEXT_PUBLIC_SUPABASE_URL ? { auth: mockAuth } : null),
}));

describe("useAccount with no Supabase config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is unavailable, and saving still works on the device alone", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const setPreferences = vi.fn();
    const { result } = renderHook(() => useAccount({ preferences: null, setPreferences }));
    expect(result.current.account).toEqual({ status: "unavailable" });

    const answers: Preferences = { space: "yard", interests: ["plants"], tools: [] };
    act(() => result.current.savePreferences(answers));
    expect(setPreferences).toHaveBeenCalledWith(answers);
    await act(() => result.current.signIn());
    expect(result.current.notice).toBeNull();
  });
});

describe("useAccount with Supabase and the Grove's anonymous sessions", () => {
  function withSession(user: { id: string; is_anonymous: boolean; user_metadata?: unknown } | null): void {
    mockAuth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      callback("INITIAL_SESSION", user ? { user: { user_metadata: {}, ...user } } : null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mockAuth.getSession.mockResolvedValue({ data: { session: user ? { user } : null } });
  }

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    Object.values(mockAuth).forEach((mock) => mock.mockReset());
    mockAuth.linkIdentity.mockResolvedValue({ error: null });
    mockAuth.signInWithOAuth.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("treats an anonymous Grove session as signed out", () => {
    withSession({ id: "anon-1", is_anonymous: true });
    const { result } = renderHook(() => useAccount({ preferences: null, setPreferences: vi.fn() }));
    expect(result.current.account).toEqual({ status: "signed_out" });
  });

  it("upgrades an anonymous visitor in place, so their Grove stays theirs", async () => {
    withSession({ id: "anon-1", is_anonymous: true });
    const { result } = renderHook(() => useAccount({ preferences: null, setPreferences: vi.fn() }));
    await act(() => result.current.signIn());
    expect(mockAuth.linkIdentity).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" }));
    expect(mockAuth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("signs in plainly when that Google account is already taken", async () => {
    withSession({ id: "anon-1", is_anonymous: true });
    const { result } = renderHook(() =>
      useAccount({ preferences: null, setPreferences: vi.fn(), isGoogleAccountTaken: true }),
    );
    expect(result.current.notice).toMatch(/already has a Fixie account/);
    await act(() => result.current.signIn());
    expect(mockAuth.linkIdentity).not.toHaveBeenCalled();
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" }));
  });

  it("falls back to a plain sign-in when linking can't start", async () => {
    withSession({ id: "anon-1", is_anonymous: true });
    mockAuth.linkIdentity.mockResolvedValue({ error: { code: "manual_linking_disabled", name: "AuthApiError" } });
    const { result } = renderHook(() => useAccount({ preferences: null, setPreferences: vi.fn() }));
    await act(() => result.current.signIn());
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledOnce();
  });
});
