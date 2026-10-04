"use client";

import { useSyncExternalStore } from "react";
import type { GroveEntry, GroveLogRequest, LogOutcome } from "@/lib/grove/entries";
import { createLocalGroveStore, type LocalGroveStore } from "@/lib/grove/local-store";
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
  store ??= isRemoteConfigured ? createRemoteGroveStore({ local: getLocal() }) : getLocal();
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

export interface UseGrove {
  /** Oldest first. */
  entries: readonly GroveEntry[];
  status: GroveStatus;
  /** True when the Grove is kept in Supabase rather than on this device only. */
  isRemote: boolean;
  /** Saves a result as a new branch. Resolves with the entry, or why it failed; never rejects. */
  log: (request: GroveLogRequest) => Promise<LogOutcome>;
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
    refresh: () => void getStore().refresh(),
    devTools:
      activeStore && !activeStore.isRemote
        ? { addSamples: (count) => getLocal().addSamples(count), clear: () => getLocal().clear() }
        : undefined,
  };
}
