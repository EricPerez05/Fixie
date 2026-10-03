import type { ScanResult } from "./schema";

/**
 * Canned results for `?demo=1`, so the demo survives venue Wi-Fi and runs
 * with no model access. Each one must satisfy the same safety rules as a
 * live answer; tests/unit/lib/scan/demo-results.test.ts checks that.
 */
export const DEMO_RESULTS: readonly ScanResult[] = [
  {
    status: "ok",
    item: "Glass jar",
    material: "Glass",
    fairy: "glass",
    recyclable: "yes",
    howToRecycle: [
      "Rinse it out.",
      "Remove the metal lid and recycle it separately.",
      "Peel off the label if it comes away easily.",
    ],
    repurpose: [
      {
        title: "Fairy lantern",
        steps: "Drop in a battery tea light and wrap twine around the neck.",
      },
      {
        title: "Herb planter",
        steps: "Add pebbles for drainage, then soil and a basil cutting.",
      },
    ],
    caution: null,
    confidence: "high",
  },
  {
    status: "ok",
    item: "Aluminium drink can",
    material: "Aluminium",
    fairy: "metal",
    recyclable: "yes",
    howToRecycle: ["Empty and rinse it.", "Leave it uncrushed if your hauler sorts by shape."],
    repurpose: [
      {
        title: "Desk caddy",
        steps: "Cover it in washi tape so no rim edge is exposed, then fill with pens.",
      },
      {
        title: "Seed-starter pot",
        steps: "Punch drainage holes in the base with a nail and add potting mix.",
      },
    ],
    caution: null,
    confidence: "high",
  },
  {
    status: "ok",
    item: "Cardboard box",
    material: "Corrugated cardboard",
    fairy: "paper",
    recyclable: "yes",
    howToRecycle: [
      "Remove tape and shipping labels.",
      "Flatten it.",
      "Keep it dry; wet or greasy cardboard goes in compost or trash.",
    ],
    repurpose: [
      {
        title: "Drawer dividers",
        steps: "Cut strips to the drawer depth and slot them together in a grid.",
      },
      {
        title: "Garden mulch layer",
        steps: "Lay it flat under mulch to smother weeds; it breaks down in a season.",
      },
    ],
    caution: null,
    confidence: "high",
  },
  {
    status: "ok",
    item: "AA battery",
    material: "Alkaline battery",
    fairy: "electronic",
    recyclable: "special_dropoff",
    howToRecycle: [
      "Do not put it in household recycling or trash.",
      "Tape over the ends.",
      "Take it to a battery drop-off point, such as a hardware store or library.",
    ],
    // SAFETY: hazardous items never get reuse ideas.
    repurpose: [],
    caution: "Batteries can leak or start fires in collection trucks. Keep them out of the bin.",
    confidence: "high",
  },
];

/**
 * Picks a canned result. Deterministic for a given image so a retake of the
 * same frame shows the same answer, which keeps the demo predictable.
 * Never fails: any string maps to some entry.
 */
export function pickDemoResult(image: string): ScanResult {
  // Hash the content, not the length: base64 length is always a multiple of
  // 4, so `length % 4` would pick the same entry every time. Sampling every
  // 97th char keeps this cheap on a 1.5MB string.
  let hash = 0;
  for (let i = 0; i < image.length; i += 97) {
    hash = (hash * 31 + image.charCodeAt(i)) >>> 0;
  }
  return DEMO_RESULTS[hash % DEMO_RESULTS.length];
}
