import "server-only";
import { z } from "zod";

// Haiku is the default for speed on stage; SCAN_MODEL lets us switch to a
// more accurate model without a code change (see brief §3).
const DEFAULT_SCAN_MODEL = "claude-haiku-4-5-20251001";

const ServerEnv = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  SCAN_MODEL: z.string().trim().min(1).optional(),
});

export interface ScanEnv {
  anthropicApiKey: string;
  scanModel: string;
}

/**
 * Reads and validates the server env vars the scan route needs.
 * Throws an Error naming the missing or invalid keys (never their values),
 * so a misconfigured deploy fails loudly instead of returning wrong answers.
 */
export function getScanEnv(source: NodeJS.ProcessEnv = process.env): ScanEnv {
  const parsed = ServerEnv.safeParse({
    ANTHROPIC_API_KEY: source.ANTHROPIC_API_KEY,
    // An empty SCAN_MODEL= line in .env means "use the default", not "invalid".
    SCAN_MODEL: source.SCAN_MODEL || undefined,
  });
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${keys}`);
  }
  return {
    anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
    scanModel: parsed.data.SCAN_MODEL ?? DEFAULT_SCAN_MODEL,
  };
}
