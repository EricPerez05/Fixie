import { describe, expect, it } from "vitest";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";
import { canLog, isReopenable, parseRecent, type RecentResult } from "@/lib/scan/recent";
import { UNSURE_RESULT } from "@/lib/scan/schema";

const JAR = DEMO_RESULTS[0];
const RECENT: RecentResult = {
  id: "r1",
  result: JAR,
  source: "scan",
  scannedAt: "2026-10-04T12:00:00.000Z",
  entryId: null,
};

describe("canLog", () => {
  it("lets the user log their own identified scan once", () => {
    expect(canLog(RECENT)).toBe(true);
    expect(canLog({ ...RECENT, entryId: "e1" })).toBe(false);
  });

  it("never logs examples or reopened Grove entries", () => {
    expect(canLog({ ...RECENT, source: "example" })).toBe(false);
    expect(canLog({ ...RECENT, source: "grove" })).toBe(false);
  });

  it("never logs a result the fairies couldn't identify", () => {
    expect(canLog({ ...RECENT, result: UNSURE_RESULT })).toBe(false);
    expect(canLog({ ...RECENT, result: { ...JAR, confidence: "low" } })).toBe(false);
  });
});

describe("isReopenable", () => {
  it("offers identified results and not retake prompts", () => {
    expect(isReopenable(JAR)).toBe(true);
    expect(isReopenable(UNSURE_RESULT)).toBe(false);
  });
});

describe("parseRecent", () => {
  it("round-trips a saved result", () => {
    expect(parseRecent(JSON.stringify(RECENT))).toEqual(RECENT);
  });

  it("returns null for missing, corrupt or outdated data", () => {
    expect(parseRecent(null)).toBeNull();
    expect(parseRecent("{not json")).toBeNull();
    expect(parseRecent(JSON.stringify({ ...RECENT, source: "camera" }))).toBeNull();
  });

  it("re-applies the safety rules to a stored result", () => {
    const hazard = { ...RECENT, result: { ...JAR, caution: "Sharp edges." } };
    expect(parseRecent(JSON.stringify(hazard))?.result.repurpose).toEqual([]);
    const guess = { ...RECENT, result: { ...JAR, confidence: "low" } };
    expect(parseRecent(JSON.stringify(guess))).toBeNull();
  });
});
