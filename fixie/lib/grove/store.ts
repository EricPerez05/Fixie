import type { GroveEntry, GroveLogRequest, LogOutcome } from "./entries";

/*
 * The Grove's storage, behind one small interface so the UI doesn't care
 * where branches live: LocalGroveStore keeps them on this device, and
 * RemoteGroveStore keeps them in Supabase through /api/grove. Both are
 * external stores for useSyncExternalStore.
 */

export type GroveStatus = "loading" | "ready" | "error";

export interface GroveSnapshot {
  /** Oldest first. */
  entries: readonly GroveEntry[];
  /** "error" means the last sync failed; entries then hold what this device remembers. */
  status: GroveStatus;
}

export interface GroveStore {
  /** True when entries are kept server-side. */
  readonly isRemote: boolean;
  subscribe: (listener: () => void) => () => void;
  /** Returns the same object until something changes. */
  getSnapshot: () => GroveSnapshot;
  /** Plants a branch. Resolves with the entry or why it failed; never rejects. */
  log: (request: GroveLogRequest) => Promise<LogOutcome>;
  /** Removes an entry and its photo. Resolves false if it couldn't; never rejects. */
  remove: (id: string) => Promise<boolean>;
  /** A URL the browser can show for the entry's photo, or null. Never rejects. */
  photoUrl: (entry: GroveEntry) => Promise<string | null>;
  /** Re-syncs, for example after a signed photo URL expired. Never rejects. */
  refresh: () => Promise<void>;
}

export const EMPTY_SNAPSHOT: GroveSnapshot = { entries: [], status: "ready" };
