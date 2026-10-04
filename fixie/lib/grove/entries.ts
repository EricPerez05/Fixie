import { z } from "zod";
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
      return parsed.success && canGrow(parsed.data.result) ? [parsed.data] : [];
    })
    .slice(-MAX_GROVE_ENTRIES);
}

/** How many scans could stay out of the trash: recyclable, or recyclable at a drop-off. */
export function countRecyclable(entries: readonly GroveEntry[]): number {
  return entries.filter(({ result }) => result.recyclable === "yes" || result.recyclable === "special_dropoff").length;
}
