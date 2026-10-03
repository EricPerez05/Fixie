import { describe, expect, it } from "vitest";
import { ScanResult } from "@/lib/scan/schema";
import { DEMO_RESULTS, pickDemoResult } from "@/lib/scan/demo-results";

describe("DEMO_RESULTS", () => {
  it.each(DEMO_RESULTS.map((result) => [result.item, result] as const))("%s matches the contract", (_, result) => {
    expect(ScanResult.safeParse(result).success).toBe(true);
  });

  // SAFETY: canned answers go in front of judges; they must follow the same
  // hazard rule as live ones.
  it("never offers reuse ideas for hazardous items", () => {
    for (const result of DEMO_RESULTS) {
      if (result.recyclable === "special_dropoff" || result.caution) {
        expect(result.repurpose).toEqual([]);
      }
    }
  });

  it("includes a hazardous example so the battery path is demoable", () => {
    expect(DEMO_RESULTS.some((result) => result.recyclable === "special_dropoff")).toBe(true);
  });
});

describe("pickDemoResult", () => {
  it("is deterministic for the same image", () => {
    expect(pickDemoResult("abc")).toBe(pickDemoResult("abc"));
  });

  it("reaches every canned result across different base64 images", () => {
    const seen = new Set<ScanResult>();
    for (let i = 0; i < 200; i++) {
      // Long enough that the 97-char sampling stride sees varied content,
      // like a real frame (tens of thousands of chars).
      seen.add(pickDemoResult(btoa(`frame-${i}-`.repeat(200))));
    }
    expect(seen.size).toBe(DEMO_RESULTS.length);
  });
});
