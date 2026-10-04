"use client";

import { useSyncExternalStore } from "react";
import { parseRecent, type RecentResult } from "@/lib/scan/recent";
import { log } from "@/lib/log";

// sessionStorage, not localStorage: the last result should survive a reload
// or a trip to the Grove, but not outlive the tab.
const STORAGE_KEY = "fixie.recent.v1";

const listeners = new Set<() => void>();
// Parsed once and kept in step with every write, so getSnapshot returns the
// same object between changes. Also the fallback when storage is blocked.
let cache: RecentResult | null | undefined;

function read(): RecentResult | null {
  if (cache === undefined) {
    try {
      cache = parseRecent(window.sessionStorage.getItem(STORAGE_KEY));
    } catch {
      // Private mode or blocked storage: remember it for this page only.
      cache = null;
    }
  }
  return cache;
}

function write(next: RecentResult | null): void {
  cache = next;
  try {
    if (next) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Quota or blocked storage. The chip still works until the page reloads.
    log.warn("recent.save_failed", { reason: error instanceof Error ? error.name : "Unknown" });
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Replaces the recent result, or forgets it with null. */
function setRecent(next: RecentResult | null): void {
  write(next);
}

/** Records that the recent result was logged as `entryId`. Ignored if it has since been replaced. */
function markLogged(id: string, entryId: string): void {
  const current = read();
  if (current?.id === id) write({ ...current, entryId });
}

export interface UseRecentResult {
  /** The last result the user scanned or tried, or null. */
  recent: RecentResult | null;
  setRecent: (next: RecentResult | null) => void;
  markLogged: (id: string, entryId: string) => void;
}

/**
 * The most recent result, kept after its card closes so Home can offer to
 * reopen it. Only a new scan or example replaces it. Results only: the photo
 * is never written to storage here.
 */
export function useRecentResult(): UseRecentResult {
  // The server snapshot is empty, so the first render matches the server's.
  const recent = useSyncExternalStore(subscribe, read, () => null);
  return { recent, setRecent, markLogged };
}
