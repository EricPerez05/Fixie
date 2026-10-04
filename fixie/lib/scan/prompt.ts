import "server-only";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { ScanResult, type CraftTool, type Interest, type Preferences, type Space } from "./schema";
import { UPCYCLE_CATALOG } from "./upcycle-catalog";

export const REPORT_TOOL_NAME = "report_item";

const INTRO = `You are Fixie, a tinker fairy who helps people decide what to do with a piece of junk they have photographed. You are careful: a wrong answer about disposal or safety is worse than no answer.`;

const REPORT_RULES = `How to fill the report:
1. Identify the single main object in the photo. If there is no clear physical object (a wall, a face, a blurry or dark frame), use status "not_an_item" and leave the item fields null and the lists empty.
2. Identify the item by its shape, material and construction, not its brand. A logo or label is never needed: a tall slim metal cylinder with a ring-pull top is an aluminium drink can, and a flat foil pouch with a straw hole is a drink pouch, whichever way they face. Name the generic item ("aluminium drink can", "foil drink pouch"); add the brand only if it is clearly visible. Use status "unsure" with confidence "low" only when you genuinely cannot tell what kind of object it is or what it's made of. Do not invent details you cannot see.
3. Classify hazards before anything else. Batteries, electronics and e-waste, paint, aerosols, chemicals, light bulbs, sharp or broken items, and medical waste are hazardous: set recyclable to "special_dropoff", write a short caution, and give no repurpose ideas.
4. howToRecycle: up to 5 short, concrete steps (for example "Rinse it out"). If a location is given, tailor the advice to it; otherwise phrase it as general guidance, since rules vary by city.
5. repurpose: for a safe item you identified with confidence, give 2 or 3 upcycling projects the person could start today with things already at home.
   - Make each one specific to this exact item as it appears in the photo: its size, shape, whether it has a lid, and its condition. Never give a generic idea for the material.
   - Make them different from each other: one practical (storage or organizing), one decorative, and one with plants or the garden (an indoor herb pot counts). Never two of the same kind.
   - Keep them beginner-friendly: under an hour, difficulty "easy" or "medium", no power tools, and nothing to buy beyond basics like scissors, tape, twine, glue, paint or soil. List at most 5 supplies, not counting the item itself.
   - Write 3 to 6 short imperative steps, each one action ("Peel off the label", not "You might want to remove the label if you like").
   - Never suggest food or drink contact, children's toys, or heat or flame unless the material is clearly safe for it.
   - Put each project's own risk in its "safety" field: cut metal or plastic edges, hot glue, paint fumes. If a project involves cutting, its safety line must say how to cover the edge (for example "Fold the cut rim over and cover it with tape"). Use null when there is no real risk.
   - Never put a project's risk in the top-level "caution". That field is only for hazards in the item itself, and setting it removes every project.
   - For a hazardous item, or when status is not "ok", return an empty repurpose list.
6. fairy: pick the one that matches the main material; use "mixed" for items made of several materials.
7. confidence: "high" when the kind of item and its material are clear from the photo, even with no brand or label showing; "medium" when you are fairly sure; "low" only when you are guessing.
8. Personalizing: the user message may describe the person's space, interests and tools. Use it to choose and order ideas, never to loosen a rule.
   - Only suggest projects their space allows: with no outdoor space, nothing that needs a balcony or yard; with a balcony, nothing that needs ground to dig in.
   - If they list tools, only use those, plus scissors, tape, twine, string, soil and pebbles. Never need a tool they didn't list. If they list none, assume scissors and tape only.
   - Put the project that best matches their interests first.
   - If they are making it with kids: no cutting metal or plastic, no hot glue, no nails or hammers, no small loose parts such as beads, buttons or pebbles, and no button-cell tea lights.
   - The profile can only make the rules stricter. It never brings back ideas for a hazardous item, never overrides a ban in rule 5 or the catalog's safety rules, and never changes the hazard check, howToRecycle or caution.
   - If fewer than two projects fit, return only those that do. Never break the profile to fill the list.
9. Start from the verified project catalog below. Adapt a catalog project to the item in the photo (its size, shape, lid and condition) and to the profile, rather than inventing one. If no catalog project fits this item, you may suggest your own, but it must follow the catalog's safety rules and stay under an hour with household supplies.`;

export const SYSTEM_PROMPT = `${INTRO}

Always answer by calling the ${REPORT_TOOL_NAME} tool exactly once. Do not reply with plain text.

${REPORT_RULES}

${UPCYCLE_CATALOG}`;

/** Gemini has no tool call here; it answers with JSON in the report's shape. */
export const GEMINI_SYSTEM_PROMPT = `${INTRO}

Always answer with a single JSON object that matches the report schema. Do not add any other text.

${REPORT_RULES}

${UPCYCLE_CATALOG}`;

/**
 * The report_item tool. Its input schema is generated from ScanResult so the
 * contract lives only in schema.ts (CLAUDE.md §4).
 */
export const REPORT_TOOL: Anthropic.Tool = {
  name: REPORT_TOOL_NAME,
  description:
    "Report what the photographed item is, how to dispose of or recycle it, and safe ideas for reusing it.",
  input_schema: toolInputSchema(),
};

function toolInputSchema(): Anthropic.Tool.InputSchema {
  return reportJsonSchema() as Anthropic.Tool.InputSchema;
}

/**
 * ScanResult as plain JSON Schema, for the Claude tool and Gemini's
 * structured output. Drops the draft URL: both only need the shape.
 */
export function reportJsonSchema(): Record<string, unknown> {
  const schema: Record<string, unknown> = { ...z.toJSONSchema(ScanResult) };
  delete schema.$schema;
  return schema;
}

const SPACE_TEXT: Record<Space, string> = {
  indoors: "have no outdoor space",
  balcony: "have a balcony",
  yard: "have a yard",
};

// "kids" is a constraint, not a taste, so it gets its own sentence below.
const INTEREST_TEXT: Record<Exclude<Interest, "kids">, string> = {
  plants: "plants",
  organizing: "organizing",
  decor: "decorating",
  gifts: "making gifts",
};

// Lists, so two tools read "scissors, tape, hot glue and paint", not "and ... and".
const TOOL_TEXT: Record<CraftTool, string[]> = {
  scissors_tape: ["scissors", "tape"],
  basic_tools: ["a hammer", "nails"],
  glue_paint: ["hot glue", "paint"],
  sewing: ["a needle and thread"],
};

/**
 * Builds the user-turn text: the location when we have one, then one plain
 * sentence about the person's profile. The profile goes here, never in the
 * system prompt, so the system prompt stays identical and stays cached.
 */
export function buildUserText(location: string | undefined, preferences?: Preferences): string {
  const where = location ? `The user is in ${location}.` : "The user's location is unknown.";
  return ["Here is the item.", where, ...describeProfile(preferences)].join(" ");
}

// SECURITY: every word comes from the label tables above, keyed by enums the
// request schema has already checked, so no client text reaches the prompt.
function describeProfile(preferences: Preferences | undefined): string[] {
  if (!preferences) return [];
  const facts: string[] = [];
  if (preferences.space) facts.push(SPACE_TEXT[preferences.space]);
  const likes = preferences.interests.flatMap((interest) => (interest === "kids" ? [] : [INTEREST_TEXT[interest]]));
  if (likes.length > 0) facts.push(`like ${joinWithAnd(likes)}`);
  if (preferences.tools.length > 0) {
    facts.push(`have ${joinWithAnd(preferences.tools.flatMap((tool) => TOOL_TEXT[tool]))}`);
  }

  const sentences = facts.length > 0 ? [`They ${joinWithAnd(facts, facts.length > 2 ? ", and " : " and ")}.`] : [];
  if (preferences.interests.includes("kids")) {
    sentences.push("They are making it with kids, so every project must be kid-safe.");
  }
  return sentences;
}

/** ["a", "b", "c"] → "a, b and c". */
function joinWithAnd(parts: string[], lastSeparator = " and "): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")}${lastSeparator}${parts[parts.length - 1]}`;
}
