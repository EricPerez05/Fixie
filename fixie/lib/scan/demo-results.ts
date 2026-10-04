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
        title: "Firefly jar lantern",
        summary: "A glowing table lantern for evenings outside, made from the jar and its lid.",
        difficulty: "easy",
        minutes: 15,
        supplies: ["Battery fairy lights", "Twine", "Scissors"],
        steps: [
          "Peel off the label and dry the jar inside and out.",
          "Coil the fairy lights loosely into the jar, leaving the battery pack outside.",
          "Rest the lid on top so the wire runs out under one side.",
          "Wrap twine around the neck five times and knot it.",
          "Tie a loop of twine to the knot to hang it from a branch or hook.",
        ],
        safety: null,
      },
      {
        title: "Tidy-tinker button keeper",
        summary: "A see-through home for buttons, safety pins or spare screws, so you can spot what you need.",
        difficulty: "easy",
        minutes: 10,
        supplies: ["Paper", "Pen", "Clear tape"],
        steps: [
          "Wash and fully dry the jar and lid.",
          "Write what goes inside on a strip of paper.",
          "Tape the label to the front of the jar with clear tape.",
          "Fill it and screw the lid on tight.",
        ],
        safety: null,
      },
      {
        title: "Windowsill herb nook",
        summary: "A little jar garden for basil or mint that you can watch grow on a sunny sill.",
        difficulty: "easy",
        minutes: 20,
        supplies: ["Small pebbles", "Potting soil", "Herb cutting or seeds", "Spoon"],
        steps: [
          "Spoon a layer of pebbles into the bottom for drainage.",
          "Fill the jar two-thirds with potting soil.",
          "Press in a herb cutting or a few seeds and firm the soil.",
          "Water lightly until the soil is damp, not soggy.",
          "Leave the lid off and set it on a sunny windowsill.",
        ],
        safety: null,
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
        title: "Wand-keeper pencil pot",
        summary: "A desk pot for pens and brushes, wrapped so it looks nothing like a can.",
        difficulty: "easy",
        minutes: 20,
        supplies: ["Washi tape or yarn", "Scissors", "Glue stick"],
        steps: [
          "Rinse the can and let it dry upside down.",
          "Run a strip of washi tape over the top rim so no metal edge shows.",
          "Wrap the outside in tape stripes or glue-dotted yarn, top to bottom.",
          "Trim any loose ends and press them flat.",
          "Stand your pens and brushes inside.",
        ],
        safety: "The opening rim can be sharp: cover it with a folded strip of tape before you handle it much.",
      },
      {
        title: "Twinkle-tin wind chime",
        summary: "A light, jingly chime for a porch or balcony, made from the can and its ring-pull.",
        difficulty: "medium",
        minutes: 40,
        supplies: ["Nail", "Hammer", "String", "Paint", "Old buttons or keys"],
        steps: [
          "Rinse and dry the can, then paint the outside and let it dry.",
          "Lay the can on its side on an old towel and tap a hole in the base with the nail.",
          "Thread string through the hole and knot it inside to hang the can upside down.",
          "Tie three short strings to the ring-pull and add a button or key to each end.",
          "Hang it where the wind can reach it.",
        ],
        safety:
          "Wear gloves while tapping the hole and cover the rough metal around it with tape. Paint in a ventilated room.",
      },
      {
        title: "Seedling starter tin",
        summary: "A sturdy pot to sprout a seedling before planting it out in the garden.",
        difficulty: "easy",
        minutes: 15,
        supplies: ["Nail", "Hammer", "Potting soil", "Seeds"],
        steps: [
          "Rinse the can and stand it upright on an old towel.",
          "Tap three drainage holes in the base with the nail.",
          "Fill it with potting soil to just below the rim.",
          "Plant two or three seeds and water gently.",
          "Keep it somewhere bright until the seedling is ready to plant out.",
        ],
        safety: "Tap the holes on an old towel and cover the top rim with tape so it can't cut fingers.",
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
        title: "Drawer-dweller dividers",
        summary: "A grid of cardboard walls that turns a messy drawer into neat little rooms.",
        difficulty: "medium",
        minutes: 35,
        supplies: ["Scissors", "Ruler", "Pencil"],
        steps: [
          "Measure the inside depth and width of the drawer.",
          "Cut the box flat and mark strips as tall as the drawer is deep.",
          "Cut the strips out with scissors.",
          "Cut slits halfway into each strip where they will cross.",
          "Slot the strips together into a grid and set it in the drawer.",
        ],
        safety: "Cut away from your hand and keep fingers clear of the blade.",
      },
      {
        title: "Fairy cottage nightlight",
        summary: "A little cardboard house with cut-out windows that glows with a battery light inside.",
        difficulty: "medium",
        minutes: 45,
        supplies: ["Scissors", "Tape", "Markers or paint", "Battery tea light"],
        steps: [
          "Fold the box shut and tape the flaps into a pointed roof.",
          "Draw windows and a door on the sides.",
          "Cut out the windows, leaving the door hinged on one side.",
          "Decorate the walls with markers or paint.",
          "Set a battery tea light inside and switch it on.",
        ],
        safety: "Only ever use a battery tea light inside, never a real candle. Cut away from your hand.",
      },
      {
        title: "Weed-smothering garden mat",
        summary: "A free weed barrier for a garden bed that rots away into the soil in a season.",
        difficulty: "easy",
        minutes: 20,
        supplies: ["Watering can", "Mulch or bark chips"],
        steps: [
          "Pull off all tape and plastic labels.",
          "Flatten the box and lay it over the weedy patch.",
          "Overlap the edges so no light gets through.",
          "Soak the cardboard with water.",
          "Cover it with a thick layer of mulch.",
        ],
        safety: null,
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
