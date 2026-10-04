import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/scan/route";
import { ScanResult, UNSURE_RESULT } from "@/lib/scan/schema";

const { mockAnalyze } = vi.hoisted(() => ({ mockAnalyze: vi.fn() }));

vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/scan/analyze", () => ({ analyzeItem: mockAnalyze }));

function post(body: unknown, { isDemo = true } = {}): Request {
  return new Request(`http://localhost/api/scan${isDemo ? "?demo=1" : ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/scan", () => {
  it("returns 400 for a body that isn't JSON", async () => {
    expect((await POST(post("not json"))).status).toBe(400);
  });

  it("returns 400 when the image is missing", async () => {
    expect((await POST(post({ location: "Austin, TX" }))).status).toBe(400);
  });

  it("returns 200 with a contract-shaped result", async () => {
    const response = await POST(post({ image: "QUJD" }));
    expect(response.status).toBe(200);
    expect(ScanResult.safeParse(await response.json()).success).toBe(true);
  });

  it("answers demo requests without calling the model", async () => {
    mockAnalyze.mockClear();
    await POST(post({ image: "QUJD" }));
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it("returns the model's result for live requests", async () => {
    mockAnalyze.mockResolvedValue(UNSURE_RESULT);
    const response = await POST(post({ image: "QUJD" }, { isDemo: false }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(UNSURE_RESULT);
  });

  it("returns 500 without details when the server is misconfigured", async () => {
    mockAnalyze.mockRejectedValue(new Error("Missing or invalid environment variables: ANTHROPIC_API_KEY"));
    const response = await POST(post({ image: "QUJD" }, { isDemo: false }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
  });
});
