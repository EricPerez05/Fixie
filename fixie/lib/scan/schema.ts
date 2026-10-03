import { z } from "zod";

// Bounded so a malicious client can't post a 50MB body into a paid API call.
// ~1.5MB of base64 ≈ a 1024px JPEG with plenty of headroom.
const MAX_IMAGE_BASE64_CHARS = 1_500_000;

export const ScanRequest = z.object({
  image: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
  location: z.string().trim().max(80).optional(),
});
export type ScanRequest = z.infer<typeof ScanRequest>;

export const Fairy = z.enum([
  "glass",
  "paper",
  "metal",
  "plastic",
  "textile",
  "organic",
  "electronic",
  "mixed",
]);
export type Fairy = z.infer<typeof Fairy>;

export const Recyclable = z.enum(["yes", "no", "special_dropoff"]);
export type Recyclable = z.infer<typeof Recyclable>;

export const ScanResult = z.object({
  status: z.enum(["ok", "unsure", "not_an_item"]),
  item: z.string().nullable(),
  material: z.string().nullable(),
  fairy: Fairy.nullable(),
  recyclable: Recyclable.nullable(),
  howToRecycle: z.array(z.string()).max(5),
  repurpose: z.array(z.object({ title: z.string(), steps: z.string() })).max(3),
  caution: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});
export type ScanResult = z.infer<typeof ScanResult>;

/** The safe fallback used whenever we can't produce a trustworthy answer. */
export const UNSURE_RESULT: ScanResult = {
  status: "unsure",
  item: null,
  material: null,
  fairy: null,
  recyclable: null,
  howToRecycle: [],
  repurpose: [],
  caution: null,
  confidence: "low",
};
