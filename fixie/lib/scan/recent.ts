import { z } from "zod";
import { canGrow } from "@/lib/grove/entries";
import { enforceSafetyRules } from "./safety";
import { ScanResult } from "./schema";

/** Where a result on screen came from. Only a live scan is the user's own item. */
export const ResultSource = z.enum(["scan", "example", "grove"]);
export type ResultSource = z.infer<typeof ResultSource>;

/**
 * A result the user has seen, with enough context to reopen the same card:
 * where it came from and, once logged, the Grove entry it became.
 */
export const RecentResult = z.object({
  /** Identifies this viewing, so logging can update the right copy. */
  id: z.string().min(1),
  result: ScanResult,
  source: ResultSource,
  scannedAt: z.iso.datetime(),
  /** The Grove entry this result was logged as, or null if it isn't in the Grove. */
  entryId: z.string().min(1).nullable(),
});
export type RecentResult = z.infer<typeof RecentResult>;

/**
 * Whether the user can log this result to their Grove: only their own,
 * identified, not-yet-logged scans. Examples aren't the user's item, and a
 * Grove entry is already there.
 */
export function canLog(recent: RecentResult): boolean {
  return recent.source === "scan" && recent.entryId === null && canGrow(recent.result);
}

/**
 * Whether a result is worth offering to reopen from Home. An "unsure" or
 * "not an item" answer is a retake prompt, not something to come back to.
 */
export function isReopenable(result: ScanResult): boolean {
  return result.status === "ok" && result.item !== null;
}

/**
 * Reads a saved recent result. Never throws: missing, corrupt or outdated
 * data gives null. The result is re-checked against the safety rules, so a
 * reopened card can't show advice a fresh scan wouldn't.
 */
export function parseRecent(raw: string | null): RecentResult | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = RecentResult.safeParse(data);
  if (!parsed.success) return null;
  // SAFETY: same rules as a fresh scan.
  const result = enforceSafetyRules(parsed.data.result);
  return isReopenable(result) ? { ...parsed.data, result } : null;
}
