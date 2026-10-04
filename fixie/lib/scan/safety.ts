import type { Preferences, ScanResult } from "./schema";

/*
 * Shared by the server (every model answer) and the client (every result
 * read back from storage or the Grove API), so a stored or reopened result
 * can never show something a fresh scan wouldn't. Kept free of server-only
 * imports for that reason.
 */

// Choking hazards for young children. "button" also catches button-cell batteries.
const SMALL_PARTS = /\b(pebbles?|gravel|beads?|buttons?|marbles?|sequins?)\b/i;

/**
 * Applies the rules the prompt asks for, in code, so they hold even when the
 * model ignores the prompt. Preferences can only remove ideas, never add
 * them back. Pure; never throws.
 */
export function enforceSafetyRules(result: ScanResult, preferences?: Preferences): ScanResult {
  // SAFETY: hazardous items must never come back with reuse ideas, even if
  // the model ignores the prompt instruction. Strip them server-side.
  if (result.recyclable === "special_dropoff" || result.caution) {
    result = { ...result, repurpose: [] };
  }
  // SAFETY: rule 5 makes the model write a safety line for cut edges, hot
  // glue and fumes, which are exactly what the kids rule bans. Any idea that
  // carries one is dropped, so none is better than an unsafe one.
  // Small loose parts are a choking risk the safety line doesn't cover, so
  // supplies are checked by name as well.
  if (preferences?.interests.includes("kids")) {
    result = {
      ...result,
      repurpose: result.repurpose.filter(
        (idea) => idea.safety === null && !idea.supplies.some((supply) => SMALL_PARTS.test(supply)),
      ),
    };
  }
  // SAFETY: a low-confidence answer is a guess; don't present it as fact.
  if (result.confidence === "low" && result.status === "ok") {
    result = { ...result, status: "unsure" };
  }
  return result;
}
