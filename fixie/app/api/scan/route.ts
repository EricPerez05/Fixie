import { ScanRequest } from "@/lib/scan/schema";
import { pickDemoResult } from "@/lib/scan/demo-results";
import { log } from "@/lib/log";

export const runtime = "nodejs";
// Vision calls can take 5–15s. Without this, the platform's default limit can
// kill the function mid-response, which looks like a random failure on stage.
// Must stay above the SDK timeout set in analyze.ts.
export const maxDuration = 30;

// STUB (build order step 3): every request gets a canned result so the camera
// and result UI can be built and tested on phones before the model is wired.
// Step 5 replaces the body below with analyzeItem() for non-demo requests and
// adds rate limiting ahead of parsing.
export async function POST(req: Request): Promise<Response> {
  const parsed = ScanRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const isDemo = new URL(req.url).searchParams.get("demo") === "1";
  const result = pickDemoResult(parsed.data.image);
  log.info("scan.completed", { status: result.status, isDemo, isStub: true });
  return Response.json(result);
}
