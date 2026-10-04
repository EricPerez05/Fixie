import { z } from "zod";
import { log } from "@/lib/log";
import {
  appendEntry,
  parseEntries,
  parseGrove,
  toStoredEntry,
  type GroveEntry,
  type GroveLogRequest,
  type LogFailure,
  type LogOutcome,
} from "./entries";
import type { LocalGroveStore } from "./local-store";
import type { GroveSnapshot, GroveStore } from "./store";

// What this device last saw of the remote Grove, so the tree still draws
// offline or while the first sync is in flight. Results only, no photo URLs.
const MIRROR_KEY = "fixie.grove.remote.v1";
// A photo that fails to load usually means its signed URL expired. Re-sync
// for fresh ones, but not more than this often if photos keep failing.
const MIN_REFRESH_MS = 30_000;

const ListResponse = z.object({ entries: z.array(z.unknown()) });
const LogResponse = z.object({ entry: z.unknown() });
const Uuid = z.uuid();

interface RemoteOptions {
  /** The device's local Grove, moved up to the server once and then cleared. */
  local: LocalGroveStore;
  /** The photo saved locally for an entry, as base64 JPEG, for the move up. */
  readLocalPhoto?: (id: string) => Promise<string | null>;
  /** Called after entries move up, so their local photos can be dropped. */
  forgetLocalPhotos?: (ids: readonly string[]) => Promise<void>;
  fetchImpl?: typeof fetch;
}

function failureFor(status: number): LogFailure {
  if (status === 429) return "rate_limited";
  if (status === 422) return "not_growable";
  return "server";
}

/**
 * The Grove kept in Supabase through /api/grove, for the anonymous user in
 * this browser's cookies. The first time it syncs, it moves any local
 * entries up (once each, safe to retry) and clears them from the device.
 */
export function createRemoteGroveStore({
  local,
  readLocalPhoto = async () => null,
  forgetLocalPhotos = async () => undefined,
  fetchImpl = (...args) => fetch(...args),
}: RemoteOptions): GroveStore {
  const listeners = new Set<() => void>();
  let snapshot: GroveSnapshot | null = null;
  let syncing: Promise<void> | null = null;
  let lastSyncAt = 0;
  let isMigrating = false;

  function read(): GroveSnapshot {
    if (snapshot === null) {
      let mirrored: GroveEntry[] = [];
      try {
        mirrored = parseGrove(window.localStorage.getItem(MIRROR_KEY));
      } catch {
        // Blocked storage: no offline copy, the sync fills the tree.
      }
      snapshot = { entries: mirrored, status: "loading" };
    }
    return snapshot;
  }

  function set(next: GroveSnapshot): void {
    snapshot = next;
    try {
      const stored = next.entries.map(toStoredEntry);
      window.localStorage.setItem(MIRROR_KEY, JSON.stringify(stored));
    } catch {
      // The offline copy is a convenience; the server holds the real Grove.
    }
    listeners.forEach((listener) => listener());
  }

  async function sync(): Promise<void> {
    lastSyncAt = Date.now();
    try {
      const response = await fetchImpl("/api/grove", { headers: { Accept: "application/json" } });
      const body = ListResponse.safeParse(response.ok ? await response.json().catch(() => null) : null);
      if (!body.success) {
        log.warn("grove.sync_failed", { httpStatus: response.status });
        set({ ...read(), status: "error" });
        return;
      }
      set({ entries: parseEntries(body.data.entries), status: "ready" });
      await migrateLocal();
    } catch (error) {
      log.warn("grove.sync_failed", { reason: error instanceof Error ? error.name : "Unknown" });
      set({ ...read(), status: "error" });
    }
  }

  function startSync(): Promise<void> {
    syncing ??= sync().finally(() => {
      syncing = null;
    });
    return syncing;
  }

  async function post(request: GroveLogRequest): Promise<LogOutcome> {
    let response: Response;
    try {
      response = await fetchImpl("/api/grove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
    } catch {
      return { ok: false, reason: "network" };
    }
    if (!response.ok) return { ok: false, reason: failureFor(response.status) };
    const body = LogResponse.safeParse(await response.json().catch(() => null));
    const [entry] = body.success ? parseEntries([body.data.entry]) : [];
    return entry ? { ok: true, entry } : { ok: false, reason: "server" };
  }

  /**
   * Moves this device's local Grove up, oldest first so the tree keeps its
   * order. Stops at the first failure and tries the rest next sync; each
   * entry keeps its id, so a retry can't plant it twice.
   */
  async function migrateLocal(): Promise<void> {
    if (isMigrating) return;
    const pending = local.getSnapshot().entries;
    if (pending.length === 0) return;
    isMigrating = true;
    const moved: string[] = [];
    try {
      for (const entry of pending) {
        const photo = entry.hasPhoto ? await readLocalPhoto(entry.id) : null;
        const outcome = await post({
          id: Uuid.safeParse(entry.id).success ? entry.id : undefined,
          scannedAt: entry.scannedAt,
          result: entry.result,
          photo: photo ?? undefined,
        });
        // An entry the server refuses to grow never will; drop it rather than retry forever.
        if (!outcome.ok && outcome.reason !== "not_growable") break;
        moved.push(entry.id);
        if (outcome.ok && !read().entries.some((existing) => existing.id === outcome.entry.id)) {
          set({ ...read(), entries: appendEntry(read().entries, outcome.entry) });
        }
      }
    } finally {
      isMigrating = false;
      if (moved.length > 0) {
        local.forget(new Set(moved));
        await forgetLocalPhotos(moved);
        log.info("grove.migrated", { count: moved.length, remaining: pending.length - moved.length });
      }
    }
  }

  return {
    isRemote: true,

    subscribe(listener) {
      listeners.add(listener);
      if (read().status === "loading") void startSync();
      return () => listeners.delete(listener);
    },

    getSnapshot: read,

    async log(request) {
      const outcome = await post(request);
      if (outcome.ok) set({ ...read(), entries: appendEntry(read().entries, outcome.entry) });
      return outcome;
    },

    async remove(id) {
      try {
        const response = await fetchImpl(`/api/grove/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) return false;
      } catch {
        return false;
      }
      set({ ...read(), entries: read().entries.filter((entry) => entry.id !== id) });
      return true;
    },

    async photoUrl(entry) {
      return entry.photoUrl ?? null;
    },

    async refresh() {
      if (Date.now() - lastSyncAt < MIN_REFRESH_MS && read().status !== "error") return;
      await startSync();
    },
  };
}
