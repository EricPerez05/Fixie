# Build Prompt: Fixie

> Give this whole file to an AI coding agent (or a teammate) as the brief for building and deploying the app.
> The app is called **Fixie**: fairy + fix.

---

## 1. Your task

Build and deploy **Fixie**, a mobile-first web app. The user points their phone camera at a piece of junk, taps **Scan**, and gets:

1. what the item is and what it's made of,
2. whether and how to recycle it where they live,
3. two or three creative ideas for reusing it.

The app is themed around a whimsical fairy grove (think Pixie Hollow's tinker fairies, who turn lost human things into useful tools). Each scan summons a fairy matched to the material, such as a glass fairy for jars or a paper sprite for cardboard. The fairy presents the result.

This is a **hackathon project**. Get a working, deployed, demoable core loop first. Everything else comes after it.

---

## 2. The product

### Core loop (must ship)

1. Open the app on a phone. A full-screen rear-camera preview appears.
2. Tap **Scan**. The current frame is captured and sent to the server.
3. The server asks a vision model to identify the item and return structured JSON.
4. A fairy character for that material animates in and shows:
   - item name and material
   - recyclable (yes / no / special drop-off), with steps such as "rinse it, remove the lid"
   - two or three ideas for reusing it
5. The user can scan again.

### Stretch goals (only after the core loop is deployed and works on a real phone)

- Scan history (`localStorage` first, a database later)
- A "Tinker Journal" of saved reuse ideas, each with a done checkbox
- A live outline ("fairy ring") drawn around objects before the tap, using on-device detection
- A community counter or grove view: "1,204 items saved from landfill"
- Install to home screen (PWA manifest)

### Out of scope

- Native iOS or Android builds
- Payments or a marketplace for selling items
- Social feeds, follows or comments

---

## 3. Tech stack

### Frontend

| Layer | Choice |
|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** |
| Styling | **Tailwind CSS**, with a soft moss, fern and dewdrop palette defined as CSS variables |
| Camera | Browser `getUserMedia` into a `<video>`, with frames captured through a `<canvas>` |
| Animation | **Framer Motion** for the UI; **Rive** or **Lottie** for the fairy characters |
| Install feel | PWA manifest and icons |
| Optional live detection | MediaPipe Object Detector or TensorFlow.js (stretch only) |

### Backend

| Need | Choice |
|---|---|
| Server | **Next.js route handlers** (`app/api/**/route.ts`). There is no separate server. |
| Vision AI | **`@anthropic-ai/sdk`** with Claude. Default to `claude-haiku-4-5-20251001` for speed and fall back to `claude-sonnet-5-5` for accuracy. Keep the model name in an env var. |
| Structured output | Tool use with a defined schema, validated with **Zod** on the server |
| Database (stretch) | **Supabase** (Postgres, auth and storage in one place), or Neon + Drizzle |
| Image storage (stretch) | Supabase Storage or Vercel Blob. Do not store images in the core loop. |
| Rate limiting | **Upstash Redis** via `@upstash/ratelimit` |

### Hosting

**Vercel** for everything. It provides HTTPS automatically, which the camera requires, and supports Next.js natively.

---

## 4. Architecture

```
Phone browser
  ├─ <video> rear-camera preview (getUserMedia, facingMode: "environment")
  ├─ tap Scan → draw frame to <canvas> → downscale to ~1024px → JPEG (quality ~0.8)
  └─ POST /api/scan { image: base64, location?: "city or ZIP" }
          │
          ▼
Next.js route handler (Vercel serverless)
  ├─ rate limit (Upstash, by IP)
  ├─ cache lookup (optional, by normalised item name)
  ├─ Claude vision call with the report_item tool schema
  ├─ Zod-validate the tool output
  └─ return JSON → frontend picks the fairy by `fairy`
```

### API contract: `POST /api/scan`

Request:

```json
{ "image": "<base64 JPEG, no data: prefix>", "location": "Austin, TX" }
```

Response (validated by Zod before it is sent):

```json
{
  "status": "ok",
  "item": "glass jar",
  "material": "glass",
  "fairy": "glass",
  "recyclable": "yes",
  "howToRecycle": ["Rinse it out", "Remove the metal lid and recycle it separately"],
  "repurpose": [
    { "title": "Fairy lantern", "steps": "Add a tea light and wrap twine around the neck." },
    { "title": "Herb planter", "steps": "Add pebbles for drainage, then soil and a cutting." }
  ],
  "caution": null,
  "confidence": "high"
}
```

Field rules:

- `status`: `"ok"` | `"unsure"` | `"not_an_item"`
- `recyclable`: `"yes"` | `"no"` | `"special_dropoff"`
- `fairy`: `"glass"` | `"paper"` | `"metal"` | `"plastic"` | `"textile"` | `"organic"` | `"electronic"` | `"mixed"`
- `caution`: a string for hazardous items (batteries, e-waste, paint, chemicals, sharp edges, medical waste), otherwise `null`
- `confidence`: `"high"` | `"medium"` | `"low"`. If it is `"low"`, the UI asks for a closer or better-lit photo.

### Data model (stretch only)

```
users        id, name, created_at
scans        id, user_id, item, material, recyclable, image_url, created_at
saved_ideas  id, scan_id, title, steps, done (boolean)
```

---

## 5. Known flaws and risks, with mitigations

These are the ways this project is most likely to fail. Handle each one deliberately.

### Product and trust

| Flaw | Why it matters | Mitigation |
|---|---|---|
| **Recycling rules depend on location** | The same plastic is recyclable in one city and landfill in the next. Generic advice will often be wrong. | Pass the user's city or ZIP code into the prompt. Show "Rules vary — check your local hauler" under every result. Without a location, phrase the advice as general guidance. |
| **The model can be confidently wrong** | Misidentifying the material leads to wrong disposal advice, and wish-cycling contaminates recycling streams. | Require a `confidence` field. Return `unsure` instead of guessing. When unsure, say so, because "When in doubt, throw it out" is the industry guidance. |
| **Hazardous items** | A craft idea for a lithium battery or a paint can is dangerous. | The prompt must classify hazards first. Hazardous items return `special_dropoff` with a `caution` and **no reuse ideas**. |
| **Unsafe reuse ideas** | For example, food storage in containers that aren't food-safe, or sharp cut metal. | Prompt rule: no ideas involving food contact, children's toys or heat unless the material is clearly safe for it. Add a safety note where relevant. |
| **Photos with people or private information** | The camera may capture faces, mail or documents. | Do not store images in the core loop. If images are stored later, ask for consent and say so in the UI. |

### Technical

| Flaw | Why it matters | Mitigation |
|---|---|---|
| **The camera requires HTTPS** | `getUserMedia` fails on plain HTTP, including a phone hitting `http://<laptop-ip>:3000`. | Deploy to Vercel early, or use an HTTPS tunnel (ngrok, Cloudflare Tunnel) for phone testing. |
| **iOS Safari video quirks** | Without the right attributes the preview opens full-screen or stays black. | Add `playsInline`, `muted` and `autoPlay` to `<video>`. Start the stream from a user tap. |
| **The front camera opens by default** | Many phones open the selfie camera. | Request `facingMode: { ideal: "environment" }`. |
| **Camera permission denied** | The app becomes useless with no explanation. | Show a friendly fallback with an "Upload a photo instead" file input (`accept="image/*" capture="environment"`). |
| **Large images are slow and costly** | Full-resolution phone photos are several MB, which is slow on venue Wi-Fi. | Downscale to about 1024px on the longest side and export JPEG at about 0.8 quality before upload. |
| **Vision-call latency** | A 3–10 second wait feels broken. | Show an animated "the fairies are inspecting…" state. Use Haiku by default. Cache repeated items. |
| **Serverless timeout** | The platform's default limit can kill a slow call mid-response. | Add `export const maxDuration = 30` to `app/api/scan/route.ts` and set the SDK timeout a few seconds below that. |
| **Malformed model output** | The UI crashes on bad JSON. | Use tool use with a strict schema plus Zod validation. On failure, return `status: "unsure"` with a friendly message instead of a 500. |
| **API key exposure** | Anyone could drain your credits. | Read `ANTHROPIC_API_KEY` only inside route handlers. Never prefix it with `NEXT_PUBLIC_`. |
| **Cost and abuse during judging** | One person spamming Scan, or a scraper, burns credits. | Rate-limit `/api/scan` per IP (for example 10 per minute) with Upstash. Set a spend limit in the Anthropic console. |
| **Venue Wi-Fi failure** | The live demo dies on stage. | Record a backup screen-capture video of a full scan. Keep a demo mode (`?demo=1`) that returns canned results for three or four prepared items. |

---

## 6. Environment variables

| Name | Where | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | Yes |
| `SCAN_MODEL` | Server only | No (default `claude-haiku-4-5-20251001`) |
| `UPSTASH_REDIS_REST_URL` | Server only | For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | For rate limiting |
| `NEXT_PUBLIC_SUPABASE_URL` | Client and server | Stretch |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server | Stretch |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Stretch |

Commit a `.env.example` listing these names with empty values. Never commit real values.

---

## 7. Build order

Each step should end in something that runs.

1. **Scaffold**: `create-next-app` with TypeScript, Tailwind and the App Router. Add a theme palette and a placeholder fairy.
2. **Camera screen**: full-screen rear-camera preview, a Scan button, frame capture to a downscaled JPEG, and the permission-denied fallback.
3. **Stub API**: `/api/scan` returns hardcoded JSON in the contract shape. Wire the result card and fairy UI to it.
4. **Deploy to Vercel and test on a real iPhone and a real Android phone.** Fix camera issues now, not later.
5. **Real AI**: Claude vision call with the `report_item` tool schema, Zod validation, `maxDuration`, a friendly error state and hazard handling.
6. **Hardening**: rate limiting, a result cache, the location input, the demo mode and a backup video.
7. **Stretch goals** from section 2, in whatever order makes the demo strongest.

---

## 8. Acceptance criteria

- [ ] The deployed URL opens on iOS Safari and Android Chrome and shows the rear camera.
- [ ] Scanning a glass jar, an aluminium can, a cardboard box and a plastic bottle each gives a correct material, a sensible recycling result and at least two reuse ideas.
- [ ] Scanning a battery gives `special_dropoff` with a caution and **no** reuse ideas.
- [ ] Scanning a blank wall or a face gives `not_an_item` or `unsure`, not a guess.
- [ ] Denying camera permission shows the upload fallback, not a blank screen.
- [ ] A scan completes in under about 6 seconds on decent Wi-Fi.
- [ ] Neither the client bundle nor the repository contains the API key.
- [ ] More than 10 scans a minute from one IP are rate-limited with a friendly message.
- [ ] Demo mode works with no network access to the model.

---

## 9. Tone and design notes

- The tone is whimsical and warm but never vague. The fairy's voice is playful, while recycling steps are short, plain and imperative.
- Use the palette tokens for every colour: moss green, bark brown, dewdrop blue and a soft glimmer gold. Make sure text contrast is readable in sunlight (WCAG AA).
- Give the scan button a satisfying press, such as a little sparkle or ring ripple.
- Do not use Disney names or assets. "Tinker Bell", "Pixie Hollow" and "Never Land" are trademarks. The feel is inspiration only.
