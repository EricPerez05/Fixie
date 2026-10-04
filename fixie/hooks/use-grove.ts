"use client";

import { useSyncExternalStore } from "react";
import { appendEntry, parseGrove, toGroveEntry, type GroveEntry } from "@/lib/grove/entries";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";
import type { ScanResult } from "@/lib/scan/schema";
import { log } from "@/lib/log";

const STORAGE_KEY = "fixie.grove.v1";
const SEEN_KEY = "fixie.grove.seen";
const EMPTY: readonly GroveEntry[] = [];

const listeners = new Set<() => void>();
// Parsed once and then kept in step with every write, so getSnapshot returns
// the same array between changes (useSyncExternalStore requires that). It is
// also the fallback when storage is blocked: the Grove lasts for this visit.
let cache: readonly GroveEntry[] | null = null;

function read(): readonly GroveEntry[] {
  if (cache === null) {
    try {
      cache = parseGrove(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // Private mode or blocked storage: start empty and keep scans in memory.
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: readonly GroveEntry[]): void {
  cache = next;
  try {
    if (next.length > 0) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  cache = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function newId(): string {
  // randomUUID only exists in secure contexts; a LAN http:// address isn't one.
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Plants a branch for a scan. Unidentified scans are ignored. */
function addScan(result: ScanResult): void {
  const entry = toGroveEntry(result, new Date(), newId());
  if (entry) write(appendEntry(read(), entry));
}

/** Dev only: plants `count` branches from the canned demo results. */
function addSamples(count: number): void {
  let next = read();
  for (let i = 0; i < count; i++) {
    const sample = DEMO_RESULTS[next.length % DEMO_RESULTS.length];
    const entry = toGroveEntry(sample, new Date(), newId());
    if (entry) next = appendEntry(next, entry);
  }
  write(next);
}

function clear(): void {
  write(EMPTY);
}

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
  addScan: (result: ScanResult) => void;
  addSamples: (count: number) => void;
  clear: () => void;
}

/**
 * The user's Grove: every identified scan, saved on this device only. No
 * accounts and no images; just the results, so a branch can reopen its answer.
 */
export function useGrove(): UseGrove {
  // The server snapshot is empty, so the first render matches the server's.
  const entries = useSyncExternalStore(subscribe, read, () => EMPTY);
  return { entries, addScan, addSamples, clear };
}
