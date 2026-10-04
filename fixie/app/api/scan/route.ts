import { analyzeItem } from "@/lib/scan/analyze";
import { ScanRequest } from "@/lib/scan/schema";
import { pickDemoResult } from "@/lib/scan/demo-results";
import { log } from "@/lib/log";

export const runtime = "nodejs";
// Vision calls can take 5–15s. Without this, the platform's default limit can
// kill the function mid-response, which looks like a random failure on stage.
// Must stay above the SDK timeout set in analyze.ts.
export const maxDuration = 30;

// TODO (build order step 6): rate-limit ahead of parsing.
export async function POST(req: Request): Promise<Response> {
  const parsed = ScanRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  // Demo mode never calls the model, so it survives venue Wi-Fi and a missing key.
  const isDemo = new URL(req.url).searchParams.get("demo") === "1";
  if (isDemo) {
    const result = pickDemoResult(parsed.data.image);
    log.info("scan.completed", { status: result.status, isDemo });
    return Response.json(result);
  }

  const started = Date.now();
  try {
    const result = await analyzeItem(parsed.data);
    log.info("scan.completed", { status: result.status, fairy: result.fairy, isDemo, ms: Date.now() - started });
    return Response.json(result);
  } catch (error) {
    // analyzeItem only throws on misconfiguration (e.g. missing API key).
    log.error("scan.failed", { reason: error instanceof Error ? error.message : "Unknown" });
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
