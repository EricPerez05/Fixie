"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fixie.introSeen";

const listeners = new Set<() => void>();
// Fallback for when storage is blocked or full, so the intro doesn't come back
// within this visit. Only set when saving fails.
let memoryValue = false;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true" || memoryValue;
  } catch {
    // Private mode or blocked storage: remember it for this visit only.
    return memoryValue;
  }
}

/**
 * Whether this device has finished the first-launch intro. False on the
 * server and until the intro is completed or skipped through to the end.
 */
export function useIntroSeen(): { hasSeenIntro: boolean; markIntroSeen: () => void } {
  // The server snapshot is false, so the first render matches the server's.
  const hasSeenIntro = useSyncExternalStore(subscribe, readStored, () => false);

  const markIntroSeen = useCallback((): void => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Not remembering it across visits is fine; the memory copy covers this one.
      memoryValue = true;
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { hasSeenIntro, markIntroSeen };
}
