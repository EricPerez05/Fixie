import { describe, expect, it } from "vitest";
import { ScanRequest, ScanResult, UNSURE_RESULT } from "@/lib/scan/schema";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";

describe("ScanResult", () => {
  it("accepts the contract example and the unsure fallback", () => {
    expect(ScanResult.safeParse(DEMO_RESULTS[0]).success).toBe(true);
    expect(ScanResult.safeParse(UNSURE_RESULT).success).toBe(true);
  });

  it("rejects an unknown fairy", () => {
    expect(ScanResult.safeParse({ ...DEMO_RESULTS[0], fairy: "unicorn" }).success).toBe(false);
  });

  it("rejects more than three reuse ideas", () => {
    const idea = { title: "x", steps: "y" };
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
