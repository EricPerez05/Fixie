import { describe, expect, it } from "vitest";
import { Preferences, ScanRequest, ScanResult, UNSURE_RESULT, UpcycleIdea } from "@/lib/scan/schema";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";

describe("ScanResult", () => {
  it("accepts the contract example and the unsure fallback", () => {
    expect(ScanResult.safeParse(DEMO_RESULTS[0]).success).toBe(true);
    expect(ScanResult.safeParse(UNSURE_RESULT).success).toBe(true);
  });

  it("rejects an unknown fairy", () => {
    expect(ScanResult.safeParse({ ...DEMO_RESULTS[0], fairy: "unicorn" }).success).toBe(false);
  });

  it("accepts a full upcycling idea, with or without a safety note", () => {
    const idea = DEMO_RESULTS[1].repurpose[0];
    expect(UpcycleIdea.safeParse(idea).success).toBe(true);
    expect(UpcycleIdea.safeParse({ ...idea, safety: null }).success).toBe(true);
  });

  it("rejects an idea with no steps, too many supplies or an unknown difficulty", () => {
    const idea = DEMO_RESULTS[0].repurpose[0];
    expect(UpcycleIdea.safeParse({ ...idea, steps: [] }).success).toBe(false);
    expect(UpcycleIdea.safeParse({ ...idea, supplies: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
    expect(UpcycleIdea.safeParse({ ...idea, difficulty: "hard" }).success).toBe(false);
  });

  it("rejects more than three reuse ideas", () => {
    const idea = DEMO_RESULTS[0].repurpose[0];
    expect(ScanResult.safeParse({ ...DEMO_RESULTS[0], repurpose: [idea, idea, idea, idea] }).success).toBe(false);
  });

  it("rejects a missing field", () => {
    const withoutConfidence: Record<string, unknown> = { ...DEMO_RESULTS[0] };
    delete withoutConfidence.confidence;
    expect(ScanResult.safeParse(withoutConfidence).success).toBe(false);
  });
});

describe("ScanRequest", () => {
  it("rejects an empty image", () => {
    expect(ScanRequest.safeParse({ image: "" }).success).toBe(false);
  });

  it("rejects an oversized image", () => {
    expect(ScanRequest.safeParse({ image: "a".repeat(1_500_001) }).success).toBe(false);
  });
});

describe("Preferences", () => {
  const full = { space: "balcony", interests: ["plants", "kids"], tools: ["scissors_tape", "glue_paint"] };

  it("accepts a full profile and a skipped one", () => {
    expect(Preferences.safeParse(full).success).toBe(true);
    expect(Preferences.safeParse({ space: null, interests: [], tools: [] }).success).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(Preferences.safeParse({ ...full, space: "castle" }).success).toBe(false);
    expect(Preferences.safeParse({ ...full, interests: ["skydiving"] }).success).toBe(false);
    expect(Preferences.safeParse({ ...full, tools: ["chainsaw"] }).success).toBe(false);
  });

  it("rejects duplicates and over-long lists", () => {
    expect(Preferences.safeParse({ ...full, interests: ["plants", "plants"] }).success).toBe(false);
    const tooMany = ["plants", "organizing", "decor", "gifts", "kids", "plants"];
    expect(Preferences.safeParse({ ...full, interests: tooMany }).success).toBe(false);
    expect(Preferences.safeParse({ ...full, tools: Array(50).fill("sewing") }).success).toBe(false);
  });

  it("is optional on a scan request", () => {
    expect(ScanRequest.safeParse({ image: "QUJD" }).success).toBe(true);
    expect(ScanRequest.safeParse({ image: "QUJD", preferences: full }).success).toBe(true);
    expect(ScanRequest.safeParse({ image: "QUJD", preferences: { ...full, space: "moon" } }).success).toBe(false);
  });
});
