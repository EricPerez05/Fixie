"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { GroveEntry, GroveLogRequest, LogOutcome } from "@/lib/grove/entries";
import { createLocalGroveStore, type LocalGroveStore } from "@/lib/grove/local-store";
import { deletePhotos, readPhotoBase64 } from "@/lib/grove/photo-cache";
import { createRemoteGroveStore } from "@/lib/grove/remote-store";
import { EMPTY_SNAPSHOT, type GroveStatus, type GroveStore } from "@/lib/grove/store";

const SEEN_KEY = "fixie.grove.seen";

// Inlined at build time. With no Supabase project configured (local dev,
// previews), the Grove lives on this device only, exactly as before.
const isRemoteConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Created on first use, in the browser: both read storage.
let local: LocalGroveStore | null = null;
let store: GroveStore | null = null;

function getLocal(): LocalGroveStore {
  local ??= createLocalGroveStore();
  return local;
}

function getStore(): GroveStore {
  store ??= isRemoteConfigured
    ? createRemoteGroveStore({ local: getLocal(), readLocalPhoto: readPhotoBase64, forgetLocalPhotos: deletePhotos })
    : getLocal();
  return store;
}

const subscribe = (listener: () => void): (() => void) => getStore().subscribe(listener);
const getSnapshot = () => getStore().getSnapshot();
const getServerSnapshot = () => EMPTY_SNAPSHOT;

/** How many branches the user had already seen, so only new ones play the grow animation. */
export function readSeenCount(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markSeen(count: number): void {
  try {
    window.localStorage.setItem(SEEN_KEY, String(count));
  } catch {
    // Worst case the newest branches replay their grow animation next time.
  }
}

async function removeEntry(id: string): Promise<boolean> {
  const activeStore = getStore();
  const isRemoved = await activeStore.remove(id);
  // Keep the seen count within the Grove, or the next logged branch would
  // count as already seen and skip its grow animation.
  if (isRemoved) markSeen(Math.min(readSeenCount(), activeStore.getSnapshot().entries.length));
  return isRemoved;
}

export interface UseGrove {
  /** Oldest first. */
  entries: readonly GroveEntry[];
  status: GroveStatus;
  /** True when the Grove is kept in Supabase rather than on this device only. */
  isRemote: boolean;
  /** Saves a result as a new branch. Resolves with the entry, or why it failed; never rejects. */
  log: (request: GroveLogRequest) => Promise<LogOutcome>;
  /** Removes an entry and its photo ("un-log"). Resolves false if it couldn't; never rejects. */
  remove: (id: string) => Promise<boolean>;
  refresh: () => void;
  /** Development helpers; only for the local Grove. */
  devTools?: { addSamples: (count: number) => void; clear: () => void };
}

/**
 * The user's Grove: every result they chose to log. Kept in Supabase for an
 * anonymous user when it's configured, otherwise on this device only.
 */
export function useGrove(): UseGrove {
  // The server snapshot is empty, so the first render matches the server's.
  const { entries, status } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const activeStore = typeof window === "undefined" ? null : getStore();
  return {
    entries,
    status,
    isRemote: isRemoteConfigured,
    log: (request) => getStore().log(request),
    remove: removeEntry,
    refresh: () => void getStore().refresh(),
    devTools:
      activeStore && !activeStore.isRemote
        ? { addSamples: (count) => getLocal().addSamples(count), clear: () => getLocal().clear() }
        : undefined,
  };
}

export interface UseGrovePhotos {
  /** Entry id → a URL the browser can show. Entries without one show their fruit. */
  urls: ReadonlyMap<string, string>;
  /** Call when a photo fails to load: it falls back to the fruit, and an expired signed URL is refreshed. */
  onPhotoError: (id: string) => void;
}

const NO_PHOTOS: ReadonlyMap<string, string> = new Map();

/**
 * Photo URLs for the Grove's polaroids: object URLs from IndexedDB for a
 * local Grove, short-lived signed URLs for a remote one. Only looks them up
 * while `isEnabled` (the Grove is on screen). Never logs a URL.
 */
export function useGrovePhotos(entries: readonly GroveEntry[], isEnabled: boolean): UseGrovePhotos {
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(NO_PHOTOS);

  useEffect(() => {
    if (!isEnabled) return;
    let isCurrent = true;
    const activeStore = getStore();
    void Promise.all(
      entries.filter((entry) => entry.hasPhoto).map(async (entry) => [entry.id, await activeStore.photoUrl(entry)] as const),
    ).then((pairs) => {
      if (!isCurrent) return;
      setUrls(new Map(pairs.flatMap(([id, url]) => (url ? [[id, url] as const] : []))));
    });
    return () => {
      isCurrent = false;
    };
  }, [entries, isEnabled]);

  const onPhotoError = useCallback((id: string): void => {
    setUrls((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
    // Remote: usually an expired signed URL, and a fresh sync (throttled in
    // the store) brings new ones. Local: an object URL won't fix itself, and
    // re-reading would only hand back the same broken one.
    const activeStore = getStore();
    if (activeStore.isRemote) void activeStore.refresh();
  }, []);

  return { urls: isEnabled ? urls : NO_PHOTOS, onPhotoError };
}
