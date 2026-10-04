import { newId } from "@/lib/id";
import { log } from "@/lib/log";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";
import {
  appendEntry,
  parseGrove,
  toGroveEntry,
  toStoredEntry,
  type GroveEntry,
  type GroveLogRequest,
  type LogOutcome,
} from "./entries";
import { clearPhotos, deletePhotos, readPhoto, savePhoto } from "./photo-cache";
import { EMPTY_SNAPSHOT, type GroveSnapshot, type GroveStore } from "./store";

const STORAGE_KEY = "fixie.grove.v1";

export interface LocalGroveStore extends GroveStore {
  /** Dev only: plants `count` branches from the canned demo results. */
  addSamples: (count: number) => void;
  clear: () => void;
  /** Forgets entries that have been moved to the server. */
  forget: (ids: ReadonlySet<string>) => void;
}

/**
 * The Grove kept in this browser's localStorage. Works with no network and
 * no Supabase, and is what the app uses whenever Supabase isn't configured.
 * Storage access never throws: blocked storage keeps the Grove in memory
 * for this visit.
 */
export function createLocalGroveStore(): LocalGroveStore {
  const listeners = new Set<() => void>();
  // Parsed once and then kept in step with every write, so getSnapshot
  // returns the same object between changes (useSyncExternalStore requires
  // that). Also the fallback when storage is blocked.
  let snapshot: GroveSnapshot | null = null;
  // One object URL per photo, made on first use and revoked when the entry goes.
  const objectUrls = new Map<string, string>();

  function revoke(ids: Iterable<string>): void {
    for (const id of ids) {
      const url = objectUrls.get(id);
      if (url) URL.revokeObjectURL(url);
      objectUrls.delete(id);
    }
  }

  function read(): GroveSnapshot {
    if (snapshot === null) {
      try {
        snapshot = { entries: parseGrove(window.localStorage.getItem(STORAGE_KEY)), status: "ready" };
      } catch {
        // Private mode or blocked storage: start empty and keep logs in memory.
        snapshot = EMPTY_SNAPSHOT;
      }
    }
    return snapshot;
  }

  function write(entries: readonly GroveEntry[]): void {
    snapshot = { entries, status: "ready" };
    try {
      // Photo URLs belong to the remote Grove and expire; never keep one here.
      const stored = entries.map(toStoredEntry);
      if (stored.length > 0) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Quota or blocked storage. The branch still shows for this visit.
      log.warn("grove.save_failed", { reason: error instanceof Error ? error.name : "Unknown" });
    }
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent): void {
    // Another tab changed the Grove: re-read it on next render.
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    listeners.forEach((listener) => listener());
  }

  return {
    isRemote: false,

    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot: read,

    async log({ scannedAt, result, photo }: GroveLogRequest): Promise<LogOutcome> {
      const made = toGroveEntry(result, new Date(scannedAt), newId());
      if (!made) return { ok: false, reason: "not_growable" };
      // A photo that can't be saved (blocked IndexedDB) still logs the branch, with its fruit.
      const hasPhoto = photo ? await savePhoto(made.id, photo) : false;
      const entry = hasPhoto ? { ...made, hasPhoto } : made;
      write(appendEntry(read().entries, entry));
      return { ok: true, entry };
    },

    async remove(id) {
      const { entries } = read();
      if (!entries.some((entry) => entry.id === id)) return false;
      write(entries.filter((entry) => entry.id !== id));
      revoke([id]);
      await deletePhotos([id]);
      return true;
    },

    async photoUrl(entry) {
      if (!entry.hasPhoto) return null;
      const cached = objectUrls.get(entry.id);
      if (cached) return cached;
      const blob = await readPhoto(entry.id);
      if (!blob || typeof URL.createObjectURL !== "function") return null;
      const url = URL.createObjectURL(blob);
      objectUrls.set(entry.id, url);
      return url;
    },

    async refresh() {
      snapshot = null;
      listeners.forEach((listener) => listener());
    },

    addSamples(count) {
      let next = read().entries;
      for (let i = 0; i < count; i++) {
        const sample = DEMO_RESULTS[next.length % DEMO_RESULTS.length];
        const entry = toGroveEntry(sample, new Date(), newId());
        if (entry) next = appendEntry(next, entry);
      }
      write(next);
    },

    clear() {
      write([]);
      revoke([...objectUrls.keys()]);
      void clearPhotos();
    },

    forget(ids) {
      write(read().entries.filter((entry) => !ids.has(entry.id)));
      revoke(ids);
    },
  };
}
