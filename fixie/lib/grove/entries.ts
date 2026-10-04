import { z } from "zod";
import { enforceSafetyRules } from "@/lib/scan/safety";
import { ScanResult } from "@/lib/scan/schema";

/** One branch of the Grove: a scan the user made, with its full result so it can be reopened. */
export const GroveEntry = z.object({
  id: z.string().min(1),
  scannedAt: z.iso.datetime(),
  result: ScanResult,
});
export type GroveEntry = z.infer<typeof GroveEntry>;

// About 3KB per entry, so 500 stays well under the ~5MB localStorage quota.
// A 500-branch tree is also ~52,000px tall, which is plenty to scroll.
export const MAX_GROVE_ENTRIES = 500;

/**
 * Only scans the fairies actually identified grow a branch. An "unsure" or
 * "not an item" answer taught the user nothing, so it shouldn't count.
 */
export function canGrow(result: ScanResult): boolean {
  return result.status === "ok" && result.confidence !== "low" && result.item !== null && result.fairy !== null;
}

/** What the client sends to log a result to the Grove. */
export const GroveLogRequest = z.object({
  scannedAt: z.iso.datetime(),
  result: ScanResult,
});
export type GroveLogRequest = z.infer<typeof GroveLogRequest>;

/** Why logging failed, mapped to friendly copy by the UI. */
export type LogFailure = "not_growable" | "rate_limited" | "network" | "server";

/** Logging's outcome. Expected failures are values, not exceptions. */
export type LogOutcome = { ok: true; entry: GroveEntry } | { ok: false; reason: LogFailure };

/** Wraps a scan result as a Grove entry. Returns null when the scan shouldn't grow a branch. */
export function toGroveEntry(result: ScanResult, scannedAt: Date, id: string): GroveEntry | null {
  if (!canGrow(result)) return null;
  return { id, scannedAt: scannedAt.toISOString(), result };
}

/** Appends an entry, oldest first, keeping only the newest MAX_GROVE_ENTRIES. */
export function appendEntry(entries: readonly GroveEntry[], entry: GroveEntry): GroveEntry[] {
  return [...entries, entry].slice(-MAX_GROVE_ENTRIES);
}

/**
 * Reads the saved Grove. Never throws: missing, corrupt or non-array data
 * gives an empty Grove, and any single entry that no longer matches the
 * schema (say, after ScanResult changes) is dropped rather than losing them all.
 */
export function parseGrove(raw: string | null): GroveEntry[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data
    .flatMap((item: unknown) => {
      const parsed = GroveEntry.safeParse(item);
      if (!parsed.success) return [];
      // SAFETY: stored results get the same rules as fresh ones, so an entry
      // saved before a rule changed can't reopen with advice we no longer give.
      const entry = { ...parsed.data, result: enforceSafetyRules(parsed.data.result) };
      return canGrow(entry.result) ? [entry] : [];
    })
    .slice(-MAX_GROVE_ENTRIES);
}

/** How many scans could stay out of the trash: recyclable, or recyclable at a drop-off. */
export function countRecyclable(entries: readonly GroveEntry[]): number {
  return entries.filter(({ result }) => result.recyclable === "yes" || result.recyclable === "special_dropoff").length;
}
