import { z } from "zod";
import { enforceSafetyRules } from "@/lib/scan/safety";
import { ScanResult } from "@/lib/scan/schema";

/** One branch of the Grove: a scan the user made, with its full result so it can be reopened. */
export const GroveEntry = z.object({
  id: z.string().min(1),
  scannedAt: z.iso.datetime(),
  result: ScanResult,
  /** A photo was saved with this entry (locally in IndexedDB, or in Supabase Storage). */
  hasPhoto: z.boolean().optional(),
  /**
   * Remote Grove only: a short-lived signed URL for the photo. Never stored
   * on the device and never logged, because it carries an access token.
   */
  photoUrl: z.url().optional(),
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

// A 360px JPEG thumbnail at quality 0.75 is roughly 15–40KB, about 20–55K
// base64 characters. 150K leaves headroom and caps what one request can store.
export const MAX_PHOTO_BASE64_CHARS = 150_000;

/** What the client sends to log a result to the Grove. */
export const GroveLogRequest = z.object({
  /**
   * Set when moving an existing local entry up to the server, so a retried
   * upload finds the entry it already made instead of planting a duplicate.
   */
  id: z.uuid().optional(),
  scannedAt: z.iso.datetime(),
  result: ScanResult,
  /** The photo thumbnail as base64 JPEG with no data: prefix. Only sent when the user logs. */
  photo: z
    .string()
    .min(1)
    .max(MAX_PHOTO_BASE64_CHARS)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/)
    .optional(),
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
 * Validates a list of entries from storage or the network. Never throws: any
 * single entry that no longer matches the schema (say, after ScanResult
 * changes) is dropped rather than losing them all. Keeps the newest
 * MAX_GROVE_ENTRIES.
 */
export function parseEntries(data: unknown): GroveEntry[] {
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

/**
 * Reads the saved Grove. Never throws: missing, corrupt or non-array data
 * gives an empty Grove; see parseEntries for the per-entry rules.
 */
export function parseGrove(raw: string | null): GroveEntry[] {
  if (!raw) return [];
  try {
    return parseEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** How many scans could stay out of the trash: recyclable, or recyclable at a drop-off. */
export function countRecyclable(entries: readonly GroveEntry[]): number {
  return entries.filter(({ result }) => result.recyclable === "yes" || result.recyclable === "special_dropoff").length;
}

/** An entry as it may be stored on the device: signed photo URLs expire and carry a token, so they never are. */
export function toStoredEntry(entry: GroveEntry): GroveEntry {
  const stored = { ...entry };
  delete stored.photoUrl;
  return stored;
}
