import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanResult } from "@/lib/scan/schema";

const { mockCreate, MockAPIError, mockKnowledge } = vi.hoisted(() => {
  class MockAPIError extends Error {
    constructor(public status: number) {
      super(`API error ${status}`);
      this.name = "APIError";
    }
  }
  return { mockCreate: vi.fn(), MockAPIError, mockKnowledge: vi.fn(() => "") };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/scan/knowledge", () => ({ getKnowledgeBlock: mockKnowledge }));
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
  repurpose: [
    {
      title: "Fairy lantern",
      summary: "A glowing jar lantern.",
      difficulty: "easy",
      minutes: 15,
      supplies: ["Battery tea light", "Twine"],
      steps: ["Drop in a battery tea light.", "Wrap twine around the neck."],
      safety: null,
    },
  ],
  caution: null,
  confidence: "high",
};

const USAGE = { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

function toolResponse(input: unknown, stopReason = "tool_use"): unknown {
  return {
    stop_reason: stopReason,
    usage: USAGE,
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

  it("keeps an idea's own safety note; only a top-level caution strips ideas", () => {
    const withNote = { ...JAR, repurpose: [{ ...JAR.repurpose[0], safety: "Cover the cut rim with tape." }] };
    expect(enforceSafetyRules(withNote)).toEqual(withNote);
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
    mockKnowledge.mockReturnValue("");
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

  it("trims each idea's supplies and steps to their caps instead of failing", async () => {
    const long = {
      ...JAR.repurpose[0],
      supplies: ["a", "b", "c", "d", "e", "f", "g"],
      steps: ["1", "2", "3", "4", "5", "6", "7"],
    };
    mockCreate.mockResolvedValue(toolResponse({ ...JAR, repurpose: [long] }));
    const [idea] = (await analyzeItem({ image: "QUJD" })).repurpose;
    expect(idea.supplies).toEqual(["a", "b", "c", "d", "e"]);
    expect(idea.steps).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it.each([
    ["an API error", () => mockCreate.mockRejectedValue(new MockAPIError(500))],
    ["a timeout", () => mockCreate.mockRejectedValue(Object.assign(new Error("timed out"), { name: "APIConnectionTimeoutError" }))],
    ["a refusal", () => mockCreate.mockResolvedValue({ stop_reason: "refusal", usage: USAGE, content: [] })],
    ["a text reply with no tool call", () => mockCreate.mockResolvedValue({ stop_reason: "end_turn", usage: USAGE, content: [{ type: "text", text: "A jar!" }] })],
    ["malformed tool output", () => mockCreate.mockResolvedValue(toolResponse({ status: "ok", item: 42 }))],
  ])("returns UNSURE_RESULT on %s", async (_, arrange) => {
    arrange();
    expect(await analyzeItem({ image: "QUJD" })).toEqual(UNSURE_RESULT);
  });

  it("sends only the instructions, cached, when the knowledge base is empty", async () => {
    mockCreate.mockResolvedValue(toolResponse(JAR));
    await analyzeItem({ image: "QUJD" });
    const system = mockCreate.mock.calls[0][0].system;
    expect(system).toHaveLength(1);
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("appends the knowledge base after the instructions and caches through it", async () => {
    mockKnowledge.mockReturnValue("Verified knowledge base. <note names=\"Pizza box\">...</note>");
    mockCreate.mockResolvedValue(toolResponse(JAR));
    await analyzeItem({ image: "QUJD" });
    const system = mockCreate.mock.calls[0][0].system;
    expect(system).toHaveLength(2);
    expect(system[0].cache_control).toBeUndefined();
    expect(system[1].text).toContain("Pizza box");
    expect(system[1].cache_control).toEqual({ type: "ephemeral" });
  });

  it("applies the safety rules even when the knowledge base is in play", async () => {
    mockKnowledge.mockReturnValue("Verified knowledge base. <note names=\"Battery\">...</note>");
    mockCreate.mockResolvedValue(toolResponse({ ...JAR, recyclable: "special_dropoff", caution: "Fire risk." }));
    expect((await analyzeItem({ image: "QUJD" })).repurpose).toEqual([]);
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(analyzeItem({ image: "QUJD" })).rejects.toThrow("ANTHROPIC_API_KEY");
  });
});
