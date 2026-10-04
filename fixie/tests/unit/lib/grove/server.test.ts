import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, JPEG_BASE64, type FakeSupabase } from "../../../helpers/fake-supabase";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";
import { UNSURE_RESULT } from "@/lib/scan/schema";

vi.mock("server-only", () => ({}));
const { mockLog } = vi.hoisted(() => ({ mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/log", () => ({ log: mockLog }));

const { createEntry, deleteEntry, ensureUser, isJpeg, listEntries } = await import("@/lib/grove/server");

const JAR = DEMO_RESULTS[0];
const SCANNED_AT = "2026-10-04T12:00:00.000Z";
const ENTRY_ID = "3f2c8a5e-9b1d-4c7e-8a2f-6d4b1e9c0a7d";

let fake: FakeSupabase;

beforeEach(() => {
  fake = createFakeSupabase();
  vi.clearAllMocks();
});

describe("ensureUser", () => {
  it("returns the signed-in user without signing in again", async () => {
    expect(await ensureUser(fake.client)).toBe("user-a");
    expect(fake.calls.signIn).toBe(0);
  });

  it("signs a first-time visitor in anonymously", async () => {
    fake.user = null;
    expect(await ensureUser(fake.client)).toBe("anon-1");
  });

  it("returns null when Supabase refuses the sign-in", async () => {
    fake.user = null;
    fake.failures.signIn = true;
    expect(await ensureUser(fake.client)).toBeNull();
  });
});

describe("createEntry", () => {
  it("logs a result and its photo under the user's own folder", async () => {
    const outcome = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value).toMatchObject({ scannedAt: SCANNED_AT, result: JAR, hasPhoto: true });
    expect(outcome.value.photoUrl).toMatch(/^https:\/\/fake\.supabase\.co\/sign\/user-a\//);
    expect(fake.rows[0]).toMatchObject({ item: JAR.item, fairy: JAR.fairy, photo_path: `user-a/${outcome.value.id}.jpg` });
  });

  it("refuses results that shouldn't grow a branch", async () => {
    expect(await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: UNSURE_RESULT })).toEqual({
      ok: false,
      reason: "not_growable",
    });
    expect(fake.rows).toHaveLength(0);
  });

  it("strips reuse ideas from a hazardous result before storing it", async () => {
    const hazard = { ...JAR, recyclable: "special_dropoff" as const };
    const outcome = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: hazard });
    expect(outcome.ok && outcome.value.result.repurpose).toEqual([]);
    expect((fake.rows[0].result as typeof JAR).repurpose).toEqual([]);
  });

  it("stores the entry without a photo when the bytes aren't a JPEG", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0]).toString("base64");
    const outcome = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: png });
    expect(outcome.ok && outcome.value.hasPhoto).toBe(false);
    expect(fake.objects.size).toBe(0);
  });

  it("still logs the entry when the photo upload fails", async () => {
    fake.failures.upload = true;
    const outcome = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    expect(outcome.ok && outcome.value.hasPhoto).toBe(false);
  });

  it("removes the uploaded photo when the row can't be saved", async () => {
    fake.failures.insert = "XX000";
    const outcome = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    expect(outcome).toEqual({ ok: false, reason: "server" });
    expect(fake.objects.size).toBe(0);
    expect(fake.calls.removed).toHaveLength(1);
  });

  it("returns the existing entry when the same id is sent twice, so a retried migration can't duplicate", async () => {
    const request = { id: ENTRY_ID, scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 };
    const first = await createEntry(fake.client, "user-a", request);
    const second = await createEntry(fake.client, "user-a", request);
    expect(second.ok && second.value.id).toBe(ENTRY_ID);
    expect(first.ok && second.ok && second.value.id === first.value.id).toBe(true);
    expect(fake.rows).toHaveLength(1);
    expect(fake.calls.uploads).toHaveLength(1);
  });

  it("never logs the photo, the result text or a signed URL", async () => {
    fake.failures.insert = "XX000";
    await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    const logged = JSON.stringify([mockLog.info.mock.calls, mockLog.warn.mock.calls, mockLog.error.mock.calls]);
    expect(logged).not.toContain(JPEG_BASE64);
    expect(logged).not.toContain(JAR.item);
    expect(logged).not.toContain("token=");
  });
});

describe("listEntries", () => {
  it("returns the user's entries oldest first, with signed photo URLs", async () => {
    await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    await new Promise((resolve) => setTimeout(resolve, 2));
    await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: DEMO_RESULTS[1] });
    const outcome = await listEntries(fake.client);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.map((entry) => entry.result.item)).toEqual([JAR.item, DEMO_RESULTS[1].item]);
    expect(outcome.value[0].photoUrl).toContain("token=");
    expect(outcome.value[1].photoUrl).toBeUndefined();
  });

  it("drops rows whose stored result no longer validates", async () => {
    await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR });
    fake.rows[0].result = { status: "ok" };
    const outcome = await listEntries(fake.client);
    expect(outcome.ok && outcome.value).toEqual([]);
  });

  it("never shows another user's entries", async () => {
    await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    fake.user = { id: "user-b" };
    const outcome = await listEntries(fake.client);
    expect(outcome.ok && outcome.value).toEqual([]);
  });

  it("reports a server failure as a value", async () => {
    fake.failures.select = "XX000";
    expect(await listEntries(fake.client)).toEqual({ ok: false, reason: "server" });
  });
});

describe("deleteEntry", () => {
  it("deletes the row and its photo", async () => {
    const created = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR, photo: JPEG_BASE64 });
    if (!created.ok) throw new Error("fixture should log");
    expect(await deleteEntry(fake.client, created.value.id)).toEqual({ ok: true, value: null });
    expect(fake.rows).toHaveLength(0);
    expect(fake.objects.size).toBe(0);
  });

  it("answers not_found for an id that isn't the caller's", async () => {
    const created = await createEntry(fake.client, "user-a", { scannedAt: SCANNED_AT, result: JAR });
    if (!created.ok) throw new Error("fixture should log");
    fake.user = { id: "user-b" };
    expect(await deleteEntry(fake.client, created.value.id)).toEqual({ ok: false, reason: "not_found" });
    expect(fake.rows).toHaveLength(1);
  });
});

describe("isJpeg", () => {
  it("recognises the JPEG magic bytes", () => {
    expect(isJpeg(Buffer.from(JPEG_BASE64, "base64"))).toBe(true);
    expect(isJpeg(Buffer.from("GIF89a"))).toBe(false);
  });
});
