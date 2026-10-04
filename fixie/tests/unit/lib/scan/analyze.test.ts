import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanResult } from "@/lib/scan/schema";

const { mockCreate, MockAPIError } = vi.hoisted(() => {
  class MockAPIError extends Error {
    constructor(public status: number) {
      super(`API error ${status}`);
      this.name = "APIError";
    }
  }
  return { mockCreate: vi.fn(), MockAPIError };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    static APIError = MockAPIError;
    messages = { create: mockCreate };
  }
  return { default: Anthropic };
});

import { analyzeItem, enforceSafetyRules, resetClientForTests } from "@/lib/scan/analyze";
import { UNSURE_RESULT } from "@/lib/scan/schema";

const JAR: ScanResult = {
  status: "ok",
  item: "Glass jar",
  material: "Glass",
  fairy: "glass",
  recyclable: "yes",
  howToRecycle: ["Rinse it out."],
  repurpose: [{ title: "Fairy lantern", steps: "Add a battery tea light." }],
  caution: null,
  confidence: "high",
};

function toolResponse(input: unknown, stopReason = "tool_use"): unknown {
  return {
    stop_reason: stopReason,
    content: [{ type: "tool_use", id: "toolu_1", name: "report_item", input }],
  };
}

describe("enforceSafetyRules", () => {
  // SAFETY: required by CLAUDE.md §9.
  it("strips reuse ideas from special drop-off items", () => {
    const battery = { ...JAR, recyclable: "special_dropoff" as const };
    expect(enforceSafetyRules(battery).repurpose).toEqual([]);
  });

  it("strips reuse ideas whenever there is a caution", () => {
    expect(enforceSafetyRules({ ...JAR, caution: "Sharp edges." }).repurpose).toEqual([]);
  });

  it("turns a low-confidence ok into unsure", () => {
    expect(enforceSafetyRules({ ...JAR, confidence: "low" }).status).toBe("unsure");
  });

  it("leaves a safe, confident result alone", () => {
    expect(enforceSafetyRules(JAR)).toEqual(JAR);
  });
});

describe("analyzeItem", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    resetClientForTests();
    mockCreate.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns the validated tool output", async () => {
    mockCreate.mockResolvedValue(toolResponse(JAR));
    expect(await analyzeItem({ image: "QUJD" })).toEqual(JAR);
  });

  it("sends the image, the location and the default model", async () => {
    mockCreate.mockResolvedValue(toolResponse(JAR));
    await analyzeItem({ image: "QUJD", location: "Austin, TX" });
    const params = mockCreate.mock.calls[0][0];
    expect(params.model).toBe("claude-haiku-4-5-20251001");
    expect(params.messages[0].content[0].source.data).toBe("QUJD");
    expect(params.messages[0].content[1].text).toContain("Austin, TX");
  });

  it("uses SCAN_MODEL when set", async () => {
    vi.stubEnv("SCAN_MODEL", "claude-sonnet-5-5");
    mockCreate.mockResolvedValue(toolResponse(JAR));
    await analyzeItem({ image: "QUJD" });
    expect(mockCreate.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
  });

  it("applies the safety rules to model output", async () => {
    mockCreate.mockResolvedValue(toolResponse({ ...JAR, recyclable: "special_dropoff", caution: "Fire risk." }));
    expect((await analyzeItem({ image: "QUJD" })).repurpose).toEqual([]);
  });

  it("trims extra reuse ideas instead of failing", async () => {
    const idea = JAR.repurpose[0];
    mockCreate.mockResolvedValue(toolResponse({ ...JAR, repurpose: [idea, idea, idea, idea] }));
    expect((await analyzeItem({ image: "QUJD" })).repurpose).toHaveLength(3);
  });

  it.each([
    ["an API error", () => mockCreate.mockRejectedValue(new MockAPIError(500))],
    ["a timeout", () => mockCreate.mockRejectedValue(Object.assign(new Error("timed out"), { name: "APIConnectionTimeoutError" }))],
    ["a refusal", () => mockCreate.mockResolvedValue({ stop_reason: "refusal", content: [] })],
    ["a text reply with no tool call", () => mockCreate.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "A jar!" }] })],
    ["malformed tool output", () => mockCreate.mockResolvedValue(toolResponse({ status: "ok", item: 42 }))],
  ])("returns UNSURE_RESULT on %s", async (_, arrange) => {
    arrange();
    expect(await analyzeItem({ image: "QUJD" })).toEqual(UNSURE_RESULT);
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(analyzeItem({ image: "QUJD" })).rejects.toThrow("ANTHROPIC_API_KEY");
  });
});
