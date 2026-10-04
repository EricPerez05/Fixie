import "server-only";
import type { GeminiEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { GEMINI_SYSTEM_PROMPT, buildUserText, reportJsonSchema } from "./prompt";
import type { ScanRequest } from "./schema";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Same budget as the Claude call: below the route's maxDuration (30s).
const TIMEOUT_MS = 25_000;
// Thinking models spend output tokens before answering, so leave room.
const MAX_OUTPUT_TOKENS = 4096;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Asks Gemini to fill in the report for one photo, using its free tier.
 * Returns the parsed JSON for analyzeItem() to validate, or null on any
 * failure (timeout, quota, block, non-JSON). Never throws.
 */
export async function requestGeminiReport(input: ScanRequest, env: GeminiEnv, knowledge: string): Promise<unknown> {
  const system = knowledge ? `${GEMINI_SYSTEM_PROMPT}\n\n${knowledge}` : GEMINI_SYSTEM_PROMPT;
  const userText = buildUserText(input.location);

  let response = await post(env, buildBody(input, system, userText, true));
  // An older or newer model may reject the structured-output schema. Retry
  // once with the schema in the prompt instead, and let Zod check the shape.
  if (response?.status === 400) {
    log.warn("scan.gemini_schema_rejected");
    const withSchema = `${userText}\n\nReply with JSON matching this schema:\n${JSON.stringify(reportJsonSchema())}`;
    response = await post(env, buildBody(input, system, withSchema, false));
  }
  if (!response) return null;
  if (!response.ok) {
    // 429 is the free tier's per-minute or daily quota running out.
    log.warn("scan.model_error", { provider: "gemini", httpStatus: response.status });
    return null;
  }

  const body = (await response.json().catch(() => null)) as GeminiResponse | null;
  const candidate = body?.candidates?.[0];
  if (body?.promptFeedback?.blockReason || !candidate) {
    log.warn("scan.model_refused", { provider: "gemini", reason: body?.promptFeedback?.blockReason ?? "no_candidate" });
    return null;
  }

  const text = candidate.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    log.warn("scan.invalid_model_output", { provider: "gemini", finishReason: candidate.finishReason ?? null });
    return null;
  }
}

function buildBody(input: ScanRequest, system: string, userText: string, useSchema: boolean): unknown {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { mimeType: "image/jpeg", data: input.image } }, { text: userText }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      ...(useSchema && { responseJsonSchema: reportJsonSchema() }),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.2,
    },
  };
}

async function post(env: GeminiEnv, body: unknown): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE}/${encodeURIComponent(env.model)}:generateContent`, {
      method: "POST",
      // SECURITY: the key goes in a header, never the URL, so it can't end up in logs.
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // SECURITY: log the failure kind only; the request holds the image.
    log.warn("scan.model_error", { provider: "gemini", reason: error instanceof Error ? error.name : "Unknown" });
    return null;
  }
}

/** Without a schema, models sometimes wrap JSON in a ```json fence. */
function stripCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}
