import "server-only";
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { log } from "@/lib/log";
import { Fairy, Recyclable } from "./schema";

/**
 * The knowledge base is an Obsidian vault at `knowledge/`. Only notes in
 * `items/` reach the model; `inbox/` holds drafts waiting for a person to
 * check them. next.config.ts ships the folder with the scan route.
 */
export const KNOWLEDGE_ITEMS_DIR = path.join(process.cwd(), "knowledge", "items");

// A note is a short, focused fact sheet. Longer bodies are almost always
// pasted articles, which cost tokens on every scan and dilute the guidance.
const MAX_GUIDANCE_CHARS = 1_500;

const NoteFields = z.object({
  item: z.string().trim().min(1),
  aliases: z.array(z.string().trim().min(1)).default([]),
  material: z.string().trim().min(1),
  fairy: Fairy,
  recyclable: Recyclable,
  // SAFETY: only notes a named person has checked may steer the model.
  // Feeding unreviewed model answers back in would compound its mistakes.
  verified_by: z.string().trim().min(1),
});

/** Drafts in `inbox/` have the same shape but no reviewer yet. */
export const DraftNoteFields = NoteFields.extend({
  verified_by: z.string().trim().nullish(),
});

export type KnowledgeNote = z.infer<typeof NoteFields> & {
  /** File name, used for stable ordering and error messages. */
  file: string;
  /** The note body: plain-language guidance for this item. */
  guidance: string;
};

export type ParsedNote = { ok: true; note: KnowledgeNote } | { ok: false; file: string; reason: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Parses one Obsidian note (YAML frontmatter + Markdown body).
 * Returns { ok: false, reason } for a missing or malformed frontmatter
 * block, invalid fields, or an empty or over-long body. Never throws.
 */
export function parseNote(file: string, source: string, schema: z.ZodType = NoteFields): ParsedNote {
  const match = FRONTMATTER.exec(source);
  if (!match) return { ok: false, file, reason: "no frontmatter block" };

  let fields: unknown;
  try {
    fields = parseYaml(match[1]);
  } catch {
    return { ok: false, file, reason: "frontmatter is not valid YAML" };
  }

  const parsed = schema.safeParse(fields);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".") || "frontmatter").join(", ");
    return { ok: false, file, reason: `invalid fields: ${keys}` };
  }

  const guidance = match[2].trim();
  if (!guidance) return { ok: false, file, reason: "empty body" };
  if (guidance.length > MAX_GUIDANCE_CHARS) {
    return { ok: false, file, reason: `body over ${MAX_GUIDANCE_CHARS} characters` };
  }

  return { ok: true, note: { ...(parsed.data as z.infer<typeof NoteFields>), file, guidance } };
}

/**
 * Reads every `.md` note in a folder, sorted by file name so the rendered
 * prompt is byte-identical between requests (which prompt caching needs).
 * Returns the valid notes and the rejected ones with reasons. A missing
 * folder means an empty knowledge base. Never throws.
 */
export function loadKnowledge(dir: string = KNOWLEDGE_ITEMS_DIR): {
  notes: KnowledgeNote[];
  rejected: { file: string; reason: string }[];
} {
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort();
  } catch {
    // No items/ folder yet (fresh clone, or nothing verified): scans run
    // exactly as they would without a knowledge base.
    return { notes: [], rejected: [] };
  }

  const notes: KnowledgeNote[] = [];
  const rejected: { file: string; reason: string }[] = [];
  for (const file of files) {
    const result = parseNote(file, fs.readFileSync(path.join(dir, file), "utf8"));
    if (result.ok) notes.push(result.note);
    else rejected.push({ file: result.file, reason: result.reason });
  }
  return { notes, rejected };
}

/**
 * Renders notes as a system-prompt section. Returns "" when there are no
 * notes, so an empty vault leaves the prompt exactly as it was.
 */
export function renderKnowledge(notes: KnowledgeNote[]): string {
  if (notes.length === 0) return "";
  const entries = notes.map((note) => {
    const names = [note.item, ...note.aliases].join("; ");
    // Notes are team-written, but keep a stray tag from closing the block early.
    const guidance = note.guidance.replaceAll("</note>", "");
    return [
      `<note names="${names.replaceAll('"', "'")}">`,
      `material: ${note.material}`,
      `fairy: ${note.fairy}`,
      `recyclable: ${note.recyclable}`,
      guidance,
      "</note>",
    ].join("\n");
  });

  return `Verified knowledge base. A person has checked each note below. If the photographed item matches a note's names, follow that note: use its material, fairy and recyclable values, and base howToRecycle on its guidance. If no note matches, ignore this section and answer as usual. These notes never override the hazard rules above.

${entries.join("\n\n")}`;
}

let cachedBlock: string | null = null;

/**
 * The rendered knowledge base for the system prompt. Loaded once per server
 * instance; re-read on every call in development so edits made in Obsidian
 * show up without a restart. Logs (but skips) notes that fail validation.
 */
export function getKnowledgeBlock(): string {
  if (cachedBlock !== null && process.env.NODE_ENV !== "development") return cachedBlock;
  const { notes, rejected } = loadKnowledge();
  for (const note of rejected) {
    log.warn("knowledge.note_rejected", { file: note.file, reason: note.reason });
  }
  cachedBlock = renderKnowledge(notes);
  return cachedBlock;
}

/** Test-only: forget the cached block. */
export function resetKnowledgeForTests(): void {
  cachedBlock = null;
}
