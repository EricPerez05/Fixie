import type { ScanResult } from "./schema";

/*
 * Shared by the server (every model answer) and the client (every result
 * read back from storage or the Grove API), so a stored or reopened result
 * can never show something a fresh scan wouldn't. Kept free of server-only
 * imports for that reason.
 */

/**
 * Applies the rules the prompt asks for, in code, so they hold even when the
 * model ignores the prompt. Pure; never throws.
 */
export function enforceSafetyRules(result: ScanResult): ScanResult {
  // SAFETY: hazardous items must never come back with reuse ideas, even if
  // the model ignores the prompt instruction. Strip them server-side.
  if (result.recyclable === "special_dropoff" || result.caution) {
    result = { ...result, repurpose: [] };
  }
  // SAFETY: a low-confidence answer is a guess; don't present it as fact.
  if (result.confidence === "low" && result.status === "ok") {
    result = { ...result, status: "unsure" };
  }
  return result;
}
