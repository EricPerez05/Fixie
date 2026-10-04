import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GroveEntry } from "@/lib/grove/entries";
import { createLocalGroveStore } from "@/lib/grove/local-store";
import { createRemoteGroveStore } from "@/lib/grove/remote-store";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";

vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const JAR = DEMO_RESULTS[0];
const SCANNED_AT = "2026-10-04T12:00:00.000Z";

function entry(id: string, extra: Partial<GroveEntry> = {}): GroveEntry {
  return { id, scannedAt: SCANNED_AT, result: JAR, ...extra };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A fake /api/grove that keeps entries in memory, logging each request. */
function fakeApi(initial: GroveEntry[] = []) {
  const entries = [...initial];
  const requests: { method: string; body?: Record<string, unknown> }[] = [];
  let failPostsAfter = Infinity;
  const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    requests.push({ method, body });
    if (method === "GET") return json({ entries });
    if (method === "POST") {
      if (requests.filter((r) => r.method === "POST").length > failPostsAfter) return json({ error: "x" }, 502);
      const made = entry((body?.id as string) ?? `server-${entries.length}`, { scannedAt: body?.scannedAt as string });
      entries.push(made);
      return json({ entry: made }, 201);
    }
    return new Response(null, { status: 204 });
  });
  return {
    fetchImpl,
    requests,
    entries,
    failPostsAfter: (n: number) => {
      failPostsAfter = n;
    },
  };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => window.localStorage.clear());

describe("RemoteGroveStore", () => {
  it("syncs from the API on first subscribe", async () => {
    const api = fakeApi([entry("a")]);
    const store = createRemoteGroveStore({ local: createLocalGroveStore(), fetchImpl: api.fetchImpl });
    expect(store.getSnapshot().status).toBe("loading");
    store.subscribe(() => undefined);
    await settle();
    expect(store.getSnapshot()).toMatchObject({ status: "ready", entries: [{ id: "a" }] });
  });

  it("keeps showing the last synced Grove, without photo URLs, when the network is down", async () => {
    const api = fakeApi([entry("a", { hasPhoto: true, photoUrl: "https://x.supabase.co/sign/a.jpg?token=secret" })]);
    const first = createRemoteGroveStore({ local: createLocalGroveStore(), fetchImpl: api.fetchImpl });
    first.subscribe(() => undefined);
    await settle();
    expect(window.localStorage.getItem("fixie.grove.remote.v1")).not.toContain("token=");

    const offline = createRemoteGroveStore({
      local: createLocalGroveStore(),
      fetchImpl: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });
    offline.subscribe(() => undefined);
    await settle();
    expect(offline.getSnapshot()).toMatchObject({ status: "error", entries: [{ id: "a", hasPhoto: true }] });
  });

  it("logs an entry and adds it to the tree", async () => {
    const api = fakeApi();
    const store = createRemoteGroveStore({ local: createLocalGroveStore(), fetchImpl: api.fetchImpl });
    const outcome = await store.log({ scannedAt: SCANNED_AT, result: JAR, photo: "QUJD" });
    expect(outcome.ok).toBe(true);
    expect(store.getSnapshot().entries).toHaveLength(1);
    expect(api.requests[0].body).toMatchObject({ photo: "QUJD" });
  });

  it("maps failures to friendly reasons, never throwing", async () => {
    const statuses: [number, string][] = [
      [429, "rate_limited"],
      [422, "not_growable"],
      [502, "server"],
    ];
    for (const [status, reason] of statuses) {
      const store = createRemoteGroveStore({
        local: createLocalGroveStore(),
        fetchImpl: vi.fn(async () => json({ error: "x" }, status)),
      });
      expect(await store.log({ scannedAt: SCANNED_AT, result: JAR })).toEqual({ ok: false, reason });
    }
    const offline = createRemoteGroveStore({
      local: createLocalGroveStore(),
      fetchImpl: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });
    expect(await offline.log({ scannedAt: SCANNED_AT, result: JAR })).toEqual({ ok: false, reason: "network" });
  });

  it("moves the local Grove up once, keeping ids and photos, then clears it", async () => {
    const local = createLocalGroveStore();
    await local.log({ scannedAt: SCANNED_AT, result: JAR });
    await local.log({ scannedAt: SCANNED_AT, result: DEMO_RESULTS[1] });
    const localIds = local.getSnapshot().entries.map((e) => e.id);
    const forgetLocalPhotos = vi.fn(async () => undefined);
    const api = fakeApi();
    const store = createRemoteGroveStore({
      local,
      fetchImpl: api.fetchImpl,
      readLocalPhoto: async () => null,
      forgetLocalPhotos,
    });
    store.subscribe(() => undefined);
    await settle();

    const posted = api.requests.filter((r) => r.method === "POST").map((r) => r.body?.id);
    expect(posted).toEqual(localIds);
    expect(store.getSnapshot().entries.map((e) => e.id)).toEqual(localIds);
    expect(local.getSnapshot().entries).toEqual([]);
    expect(forgetLocalPhotos).toHaveBeenCalledWith(localIds);
  });

  it("stops at the first failed move and keeps the rest on the device for next time", async () => {
    const local = createLocalGroveStore();
    for (let i = 0; i < 3; i++) await local.log({ scannedAt: SCANNED_AT, result: JAR });
    const [first, ...rest] = local.getSnapshot().entries.map((e) => e.id);
    const api = fakeApi();
    api.failPostsAfter(1);
    const store = createRemoteGroveStore({ local, fetchImpl: api.fetchImpl });
    store.subscribe(() => undefined);
    await settle();
    expect(store.getSnapshot().entries.map((e) => e.id)).toEqual([first]);
    expect(local.getSnapshot().entries.map((e) => e.id)).toEqual(rest);
  });
});

describe("LocalGroveStore", () => {
  it("logs identified results and refuses unidentified ones", async () => {
    const store = createLocalGroveStore();
    expect((await store.log({ scannedAt: SCANNED_AT, result: JAR })).ok).toBe(true);
    expect(await store.log({ scannedAt: SCANNED_AT, result: { ...JAR, status: "unsure" } })).toEqual({
      ok: false,
      reason: "not_growable",
    });
    expect(createLocalGroveStore().getSnapshot().entries).toHaveLength(1);
  });

  it("never writes a signed photo URL to the device", async () => {
    const store = createLocalGroveStore();
    window.localStorage.setItem(
      "fixie.grove.v1",
      JSON.stringify([entry("a", { photoUrl: "https://x.supabase.co/a.jpg?token=secret" })]),
    );
    await store.log({ scannedAt: SCANNED_AT, result: JAR });
    expect(window.localStorage.getItem("fixie.grove.v1")).not.toContain("token=");
  });

  it("removes an entry", async () => {
    const store = createLocalGroveStore();
    const outcome = await store.log({ scannedAt: SCANNED_AT, result: JAR });
    if (!outcome.ok) throw new Error("fixture should log");
    expect(await store.remove(outcome.entry.id)).toBe(true);
    expect(store.getSnapshot().entries).toEqual([]);
    expect(await store.remove("missing")).toBe(false);
  });
});

describe("RemoteGroveStore.refresh", () => {
  it("re-syncs at most once per window, deferring a too-early refresh instead of dropping it", async () => {
    vi.useFakeTimers();
    try {
      const api = fakeApi([entry("a")]);
      const store = createRemoteGroveStore({ local: createLocalGroveStore(), fetchImpl: api.fetchImpl });
      store.subscribe(() => undefined);
      await vi.advanceTimersByTimeAsync(0);
      const gets = () => api.requests.filter((r) => r.method === "GET").length;
      expect(gets()).toBe(1);
      await store.refresh();
      await store.refresh();
      expect(gets()).toBe(1);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(gets()).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("RemoteGroveStore.remove", () => {
  it("deletes on the server and drops the branch, treating an already-gone entry as removed", async () => {
    for (const status of [204, 404]) {
      const api = fakeApi([entry("a")]);
      const store = createRemoteGroveStore({
        local: createLocalGroveStore(),
        fetchImpl: vi.fn(async (url: RequestInfo | URL, init?: RequestInit) =>
          init?.method === "DELETE" ? new Response(null, { status }) : api.fetchImpl(url, init),
        ),
      });
      store.subscribe(() => undefined);
      await settle();
      expect(await store.remove("a")).toBe(true);
      expect(store.getSnapshot().entries).toEqual([]);
    }
  });

  it("keeps the branch and reports failure when the server can't delete it", async () => {
    const api = fakeApi([entry("a")]);
    const store = createRemoteGroveStore({
      local: createLocalGroveStore(),
      fetchImpl: vi.fn(async (url: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "DELETE" ? json({ error: "server" }, 502) : api.fetchImpl(url, init),
      ),
    });
    store.subscribe(() => undefined);
    await settle();
    expect(await store.remove("a")).toBe(false);
    expect(store.getSnapshot().entries).toHaveLength(1);
  });
});
