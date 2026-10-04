import { describe, expect, it } from "vitest";
import { ScanRequest, ScanResult, UNSURE_RESULT, UpcycleIdea } from "@/lib/scan/schema";
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
