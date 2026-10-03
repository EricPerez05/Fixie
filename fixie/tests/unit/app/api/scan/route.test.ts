import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/scan/route";
import { ScanResult } from "@/lib/scan/schema";

vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

function post(body: unknown): Request {
  return new Request("http://localhost/api/scan?demo=1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/scan (stub)", () => {
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
});
