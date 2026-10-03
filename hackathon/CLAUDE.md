# CLAUDE.md: Fixie

This is the working agreement for this codebase. Read it before every task and check your work against it before calling anything done.

- **What to build** lives in `fixie-build-prompt.md`: the product, the API contract, risks and acceptance criteria. That brief is the spec.
- **How to build it** lives here: structure, conventions, and the bar code must clear to be review-ready.
- If the two disagree, the brief wins on *behaviour* and this file wins on *code quality*. If the code disagrees with either, say so. Don't silently pick one.

---

## 1. What this is, in one paragraph

Fixie is a mobile-first Next.js web app. A user points their phone camera at a piece of junk and taps Scan. A server route sends the frame to Claude's vision model, which returns structured JSON: the item, its material, how to recycle it locally, and ideas for reusing it. A fairy character matched to the material presents the result. It is a hackathon project, so **a working, deployed core loop beats a half-built feature list**, every time.

---

## 2. Priorities, in order

When two goals conflict, the higher one wins.

1. **Safety of the advice.** Never suggest reusing something hazardous. Never present a guess as fact. A wrong answer about a battery is worse than no answer.
2. **The core loop works on a real phone.** Camera, then scan, then result, deployed over HTTPS.
3. **Correctness at the boundaries.** Every external input is validated: request bodies, model output, env vars.
4. **Clarity.** Code a tired teammate can review at 3 a.m.
5. **Delight.** Animation, fairies, polish. Important for the demo, but only after 1 to 4.

---

## 3. Commands

```bash
pnpm dev          # local dev server (camera only works on localhost or HTTPS)
pnpm build        # production build: must pass before any PR
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest
pnpm check        # typecheck + lint + test: run before every commit
```

**`pnpm check` must be green before you say a task is done.** If something fails and you didn't cause it, report it; don't work around it.

To test the camera on a phone, deploy a Vercel preview or run an HTTPS tunnel (`ngrok http 3000`). A phone hitting `http://<laptop-ip>:3000` will not get camera access.

---

## 4. Project structure

```
app/
  layout.tsx                 # fonts, theme tokens, metadata, PWA manifest link
  page.tsx                   # the scan screen (thin: composes components)
  api/scan/route.ts          # POST /api/scan: thin handler, no business logic
components/
  camera/
    camera-view.tsx          # <video> preview + capture
    scan-button.tsx
    permission-fallback.tsx  # upload-a-photo fallback
  result/
    result-card.tsx
    fairy.tsx                # picks the character by `fairy` field
  ui/                        # small generic primitives (button, sheet, spinner)
hooks/
  use-camera.ts              # stream lifecycle, permission state
  use-scan.ts                # POST /api/scan, loading/error/result state
lib/
  scan/
    schema.ts                # Zod: THE contract. Shared by client and server.
    prompt.ts                # system prompt + tool definition   (server-only)
    analyze.ts               # the one place Claude is called     (server-only)
    demo-results.ts          # canned results for ?demo=1
  camera/
    capture-frame.ts         # canvas → downscaled JPEG base64 (pure, testable)
  env.ts                     # Zod-validated env vars             (server-only)
  rate-limit.ts              # Upstash limiter                    (server-only)
  log.ts                     # tiny structured logger
tests/
  unit/                      # mirrors lib/ and hooks/
  e2e/                       # Playwright, minimal
public/
  fairies/                   # Rive/Lottie files, icons, manifest assets
```

### Structural rules

- **`lib/scan/schema.ts` is the single source of truth for the scan contract.** Request and response types are `z.infer` of it. The Claude tool's `input_schema` is generated from it with `z.toJSONSchema()`. Never hand-write a second copy of the shape anywhere.
- **Claude is called from exactly one function**, `analyzeItem()` in `lib/scan/analyze.ts`. The route, the tests and the demo mode all go through it or around it, never beside it.
- **Server-only modules start with `import 'server-only';`**: `analyze.ts`, `prompt.ts`, `env.ts`, `rate-limit.ts`. Then an accidental client import fails the build instead of shipping a secret.
- **Route handlers are thin**: parse, rate-limit, call one `lib` function, map to a response. If a handler is over about 40 lines, logic is in the wrong place.
- **Components don't fetch.** Data access lives in hooks (`use-scan.ts`), and components receive data as props.
- **Pure functions stay pure.** `capture-frame.ts` takes a video element and options and returns a string. No React and no global state, so it can be unit-tested.

---

## 5. Code conventions

### TypeScript

- `strict: true`. No `any`. Use `unknown` and narrow it. If `any` is truly unavoidable, add a comment saying why.
- No `@ts-ignore`. Use `@ts-expect-error` with a reason, only when needed.
- Exported functions have **explicit return types**.
- Model fixed sets of values as string unions or `z.enum`, never as free strings: `type Fairy = 'glass' | 'paper' | ...`.

### Naming

- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Hooks: `useThing`.
- Booleans read as questions: `isScanning`, `hasPermission`, `canRetry`.
- Name by meaning, not type: `downscaledJpeg`, not `data2`.

### Comments: explain *why*, not *what*

The code says what it does. A comment earns its place by explaining a constraint, a trade-off, or something that broke before.

```ts
// Good: explains a constraint a reader can't infer.
// iOS Safari ignores autoPlay unless the video is also muted and inline.
<video autoPlay muted playsInline ref={videoRef} />

// Good: names the trade-off.
// 1024px is enough for the model to read labels, and keeps the upload
// under ~200KB on venue Wi-Fi. Full-resolution photos are 3–5MB.
const MAX_EDGE_PX = 1024;

// Bad: restates the code.
// set loading to true
setLoading(true);
```

Use `// SAFETY:` for anything that protects the user from bad advice, and `// SECURITY:` for anything protecting secrets, cost or abuse. Reviewers grep for both.

Every exported `lib` function gets a short JSDoc: what it does, what it returns, and **how it fails**.

### Error handling

- **Validate at every boundary with Zod `safeParse`**: request bodies, model output and env vars. Never trust a cast.
- **Expected failures are values, not exceptions.** A low-confidence or unparseable model answer returns `{ status: 'unsure' }`; it doesn't throw. Exceptions are for bugs and infrastructure failures.
- **The user never sees a raw error or a stack trace.** Map failures to friendly copy ("The fairies couldn't make that out — try a closer, brighter shot").
- **No empty `catch {}`.** Log it, handle it, or rethrow it. If you're intentionally swallowing an error, write a comment explaining why.

### Logging

- Use `lib/log.ts`, with structured fields: `log.info('scan.completed', { status, material, ms })`.
- **Never log images, base64, API keys, or full model responses.** Log the outcome and timing only.

---

## 6. Reference patterns

Copy these shapes. They are what "review-ready" means here.

### The contract (`lib/scan/schema.ts`)

```ts
import { z } from 'zod';

// Bounded so a malicious client can't post a 50MB body into a paid API call.
// ~1.5MB of base64 ≈ a 1024px JPEG with plenty of headroom.
const MAX_IMAGE_BASE64_CHARS = 1_500_000;

export const ScanRequest = z.object({
  image: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
  location: z.string().trim().max(80).optional(),
});
export type ScanRequest = z.infer<typeof ScanRequest>;

export const Fairy = z.enum([
  'glass', 'paper', 'metal', 'plastic', 'textile', 'organic', 'electronic', 'mixed',
]);

export const ScanResult = z.object({
  status: z.enum(['ok', 'unsure', 'not_an_item']),
  item: z.string().nullable(),
  material: z.string().nullable(),
  fairy: Fairy.nullable(),
  recyclable: z.enum(['yes', 'no', 'special_dropoff']).nullable(),
  howToRecycle: z.array(z.string()).max(5),
  repurpose: z.array(z.object({ title: z.string(), steps: z.string() })).max(3),
  caution: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type ScanResult = z.infer<typeof ScanResult>;

/** The safe fallback used whenever we can't produce a trustworthy answer. */
export const UNSURE_RESULT: ScanResult = {
  status: 'unsure', item: null, material: null, fairy: null, recyclable: null,
  howToRecycle: [], repurpose: [], caution: null, confidence: 'low',
};
```

### The route (`app/api/scan/route.ts`)

```ts
import { analyzeItem } from '@/lib/scan/analyze';
import { ScanRequest } from '@/lib/scan/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
// Vision calls can take 5–15s. Without this, the platform's default limit can
// kill the function mid-response, which looks like a random failure on stage.
// Must stay above the SDK timeout set in analyze.ts.
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  // SECURITY: rate-limit before parsing so abuse costs us as little as possible.
  const limit = await checkRateLimit(req);
  if (!limit.ok) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsed = ScanRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const started = Date.now();
  const result = await analyzeItem(parsed.data);
  log.info('scan.completed', { status: result.status, ms: Date.now() - started });
  return Response.json(result);
}
```

### The model call (`lib/scan/analyze.ts`, shape only)

```ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Timeout sits below the route's maxDuration (30s) so we fail gracefully
// with UNSURE_RESULT instead of the platform killing the request.
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 25_000, maxRetries: 1 });

/**
 * Identifies the item in a photo and returns recycling + reuse guidance.
 * Never throws for model-side problems: timeouts, refusals and malformed
 * output all return UNSURE_RESULT. Throws only on programmer error.
 */
export async function analyzeItem(input: ScanRequest): Promise<ScanResult> {
  // 1. messages.create with the image block, SYSTEM_PROMPT, the report_item tool,
  //    and tool_choice forcing that tool.
  // 2. Find the tool_use block; ScanResult.safeParse its input.
  // 3. On parse failure, timeout or API error: log (no image!) and return UNSURE_RESULT.
  // 4. Apply enforceSafetyRules() before returning.
}
```

### Safety rules are code, not just prompt

The prompt asks the model to behave, and the code **enforces** it. Never rely on the prompt alone for anything in `// SAFETY:`.

```ts
// SAFETY: hazardous items must never come back with reuse ideas, even if
// the model ignores the prompt instruction. Strip them server-side.
function enforceSafetyRules(result: ScanResult): ScanResult {
  if (result.recyclable === 'special_dropoff' || result.caution) {
    return { ...result, repurpose: [] };
  }
  if (result.confidence === 'low' && result.status === 'ok') {
    return { ...result, status: 'unsure' };
  }
  return result;
}
```

---

## 7. Security and cost

- `ANTHROPIC_API_KEY` and every Upstash and Supabase service key are **server-only**. Never prefix them `NEXT_PUBLIC_`. `lib/env.ts` validates them with Zod at startup and throws a clear error naming any missing key.
- **Never read or print `.env*` files.** To check a variable exists, use `test -n "$VAR"`. Keep `.env.example` up to date. Every env var read in code must appear there.
- Rate-limit `/api/scan` per IP. Cap the body size (schema above). Set a monthly spend limit in the Anthropic console before the demo.
- Do not store images in the core loop. If storage is added later, the UI must say so and ask first.

---

## 8. Frontend rules

- **Mobile first.** Design at 375px wide, then scale up. Touch targets are at least 44×44px.
- **Every async screen has four states**: idle, loading, success and error. Missing one is a review blocker.
- **Camera hygiene.** Stop all tracks when the component unmounts or the tab hides (`visibilitychange`). A camera light left on is a bug.
- **Accessibility.** The scan button has an accessible name, results are announced through an `aria-live="polite"` region, text contrast meets WCAG AA (check it in sunlight), and animations respect `prefers-reduced-motion`.
- **Theme tokens only.** All colours come from CSS variables in `app/globals.css` (moss, bark, dewdrop, glimmer). No raw hex values in components.
- **No Disney names or assets.** The Pixie Hollow vibe is inspiration only.

---

## 9. Testing

Test what can break the demo or mislead a user. Coverage numbers don't matter.

| What | How |
|---|---|
| `ScanResult` schema accepts good output and rejects malformed output | Vitest |
| `enforceSafetyRules`: a battery never gets reuse ideas; low confidence becomes `unsure` | Vitest, **required** |
| `analyzeItem` returns `UNSURE_RESULT` on timeout, refusal and bad JSON | Vitest with the SDK mocked |
| Route: 400 on a bad body, 429 when limited, 200 with a valid shape | Vitest calling `POST` directly |
| `capture-frame` downscales to at most 1024px | Vitest |
| Happy path in demo mode: load, scan, see a result | One Playwright test |

- Never call the real Claude API in tests. Mock the SDK at the module boundary.
- For safety tests, prove the test can fail: break the rule once, watch the test go red, then restore it.

---

## 10. Git and pull requests

- Branch per change: `feat/camera-view`, `fix/ios-black-preview`.
- Conventional commits: `feat(scan): validate model output with zod`.
- **Small PRs**, ideally one concern each and under about 300 changed lines.
- **Never commit** `.env*` (except `.env.example`), API keys, or test photos containing people.
- **Never push, open a PR or deploy to production without explicit approval** from the human you're working with.

### PR description template

```md
## What
One or two sentences.

## Why
Link the brief section or acceptance criterion this serves.

## How to verify
Steps, including "tested on a real phone: iOS / Android".

## Risks / follow-ups
Anything deferred, and why.
```

---

## 11. Review checklist (self-review before every PR)

- [ ] `pnpm check` and `pnpm build` are green.
- [ ] The contract shape is defined only in `lib/scan/schema.ts`.
- [ ] No secret is reachable from client code; the server-only imports are in place.
- [ ] Every external input goes through Zod `safeParse`.
- [ ] The safety rules are enforced in code and covered by a test.
- [ ] Every async UI has idle, loading, success and error states.
- [ ] No images, base64 or keys appear in logs.
- [ ] Comments explain *why*; there is no commented-out code and no stray `console.log`.
- [ ] Any new env var is added to `.env.example`.
- [ ] Camera-related changes were tested on a real phone over HTTPS.

---

## 12. Definition of done

A task is done when **all** of these are true. Not before.

1. It meets the relevant acceptance criteria in the brief.
2. `pnpm check` and `pnpm build` pass.
3. It passes the review checklist above.
4. For anything touching the camera, scan or result screens, it was verified on a deployed preview from a real phone.
5. You've reported honestly what you verified, what you didn't, and anything that still fails.

---

## 13. Known gotchas

- **The camera needs HTTPS.** `localhost` is the only exception.
- **iOS shows a black or full-screen preview** without `playsInline` and `muted`, or when the stream starts without a user gesture.
- **The front camera opens by default.** Request `facingMode: { ideal: 'environment' }`.
- **Vercel's request-body limit is about 4.5MB.** Downscaling client-side keeps you far below it.
- **A missing `maxDuration` builds fine and fails only in production under real latency.** Keep it on the scan route, above the SDK timeout.
- **Recycling rules vary by city.** Always pass the location when you have it, and always show "rules vary — check locally".
- **Venue Wi-Fi will fail at the worst moment.** `?demo=1` and a recorded backup video are not optional.

---

## 14. When in doubt

- If the brief is ambiguous, **ask; don't guess**. Note what you'd have assumed.
- If a shortcut trades away safety or correctness for speed, **don't take it**. Say what it would cost instead.
- If you find something wrong outside your task, **note it; don't fix it in the same PR**.
