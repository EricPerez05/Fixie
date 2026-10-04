import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, JPEG_BASE64, type FakeSupabase } from "../../../../helpers/fake-supabase";
import { GroveEntry, MAX_PHOTO_BASE64_CHARS } from "@/lib/grove/entries";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";

const { mockCheckRateLimit, mockCreateClient } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit, GROVE_POLICY: { name: "grove" } }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mockCreateClient }));

const { GET, POST } = await import("@/app/api/grove/route");
const { DELETE } = await import("@/app/api/grove/[id]/route");

const JAR = DEMO_RESULTS[0];
const SCANNED_AT = "2026-10-04T12:00:00.000Z";

let fake: FakeSupabase;

function post(body: unknown): Request {
  return new Request("http://localhost/api/grove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function remove(id: string): Promise<Response> {
  return DELETE(new Request(`http://localhost/api/grove/${id}`, { method: "DELETE" }), {
    params: Promise.resolve({ id }),
  });
}

describe("/api/grove", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    fake = createFakeSupabase({ user: null });
    mockCreateClient.mockResolvedValue(fake.client);
    mockCheckRateLimit.mockResolvedValue({ ok: true });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers 404 when Supabase isn't configured, so the client keeps its local Grove", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect((await GET(new Request("http://localhost/api/grove"))).status).toBe(404);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("rate-limits before parsing or signing anyone in", async () => {
    mockCheckRateLimit.mockResolvedValue({ ok: false, retryAfterSeconds: 9 });
    const response = await POST(post("not json"));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("9");
    expect(fake.calls.signIn).toBe(0);
  });

  it("answers 400 for a malformed body or an oversized photo", async () => {
    expect((await POST(post("not json"))).status).toBe(400);
    expect((await POST(post({ scannedAt: SCANNED_AT }))).status).toBe(400);
    const huge = "A".repeat(MAX_PHOTO_BASE64_CHARS + 4);
    expect((await POST(post({ scannedAt: SCANNED_AT, result: JAR, photo: huge }))).status).toBe(400);
  });

  it("signs a first-time visitor in anonymously and logs their entry", async () => {
    const response = await POST(post({ scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 }));
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const { entry } = await response.json();
    expect(GroveEntry.safeParse(entry).success).toBe(true);
    expect(entry.hasPhoto).toBe(true);
    expect(fake.calls.signIn).toBe(1);
  });

  it("answers 422 for a result that can't grow a branch", async () => {
    const unsure = { ...JAR, status: "unsure" };
    expect((await POST(post({ scannedAt: SCANNED_AT, result: unsure }))).status).toBe(422);
  });

  it("answers 503 when Supabase won't sign the visitor in", async () => {
    fake.failures.signIn = true;
    expect((await GET(new Request("http://localhost/api/grove"))).status).toBe(503);
  });

  it("lists the caller's entries", async () => {
    await POST(post({ scannedAt: SCANNED_AT, result: JAR }));
    const response = await GET(new Request("http://localhost/api/grove"));
    expect(response.status).toBe(200);
    const { entries } = await response.json();
    expect(entries.map((entry: GroveEntry) => entry.result.item)).toEqual([JAR.item]);
  });

  it("deletes an entry, 404s someone else's, and 400s a malformed id", async () => {
    const { entry } = await (await POST(post({ scannedAt: SCANNED_AT, result: JAR }))).json();
    fake.user = { id: "someone-else" };
    expect((await remove(entry.id)).status).toBe(404);
    fake.user = { id: "anon-1" };
    expect((await remove(entry.id)).status).toBe(204);
    expect(fake.rows).toHaveLength(0);
    expect((await remove("../etc")).status).toBe(400);
  });
});
