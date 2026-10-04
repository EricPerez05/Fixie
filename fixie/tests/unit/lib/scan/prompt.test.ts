import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { GEMINI_SYSTEM_PROMPT, SYSTEM_PROMPT, buildUserText } from "@/lib/scan/prompt";

describe("buildUserText", () => {
  it("says only the location when there are no preferences", () => {
    expect(buildUserText("Austin, TX")).toBe("Here is the item. The user is in Austin, TX.");
    expect(buildUserText(undefined)).toBe("Here is the item. The user's location is unknown.");
  });

  it("adds one plain sentence for a full profile", () => {
    const text = buildUserText("Austin, TX", {
      space: "balcony",
      interests: ["plants", "organizing"],
      tools: ["scissors_tape", "glue_paint"],
    });
    expect(text).toBe(
      "Here is the item. The user is in Austin, TX. They have a balcony, like plants and organizing, and have scissors, tape, hot glue and paint. Choose and order the projects to fit this profile (rule 8).",
    );
  });

  it("gives kids their own sentence", () => {
    const text = buildUserText(undefined, { space: "indoors", interests: ["kids"], tools: ["scissors_tape"] });
    expect(text).toBe(
      "Here is the item. The user's location is unknown. They have no outdoor space and have scissors and tape. They are making it with kids, so every project must be kid-safe. Choose and order the projects to fit this profile (rule 8).",
    );
  });

  it("says nothing extra for a skipped profile", () => {
    expect(buildUserText(undefined, { space: null, interests: [], tools: [] })).toBe(
      "Here is the item. The user's location is unknown.",
    );
  });
});

describe("system prompts", () => {
  it("carry the verified catalog and the personalizing rule, with nothing per-request", () => {
    for (const prompt of [SYSTEM_PROMPT, GEMINI_SYSTEM_PROMPT]) {
      expect(prompt).toContain("Verified project catalog");
      expect(prompt).toContain("8. Personalizing");
      expect(prompt).not.toContain("The user is in");
    }
  });
});
