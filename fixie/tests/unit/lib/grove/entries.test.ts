import { describe, expect, it } from "vitest";
import {
  appendEntry,
  canGrow,
  countRecyclable,
  MAX_GROVE_ENTRIES,
  parseGrove,
  toGroveEntry,
  type GroveEntry,
} from "@/lib/grove/entries";
import { DEMO_RESULTS } from "@/lib/scan/demo-results";
import { UNSURE_RESULT, type ScanResult } from "@/lib/scan/schema";

const JAR = DEMO_RESULTS[0];
const WHEN = new Date("2026-10-04T12:00:00.000Z");

function entry(id: string, result: ScanResult = JAR): GroveEntry {
  const made = toGroveEntry(result, WHEN, id);
  if (!made) throw new Error("fixture should grow");
  return made;
}

describe("canGrow", () => {
  it("grows a branch for every canned demo result", () => {
    expect(DEMO_RESULTS.every(canGrow)).toBe(true);
  });

  it("does not grow for unsure, not-an-item or low-confidence answers", () => {
    expect(canGrow(UNSURE_RESULT)).toBe(false);
    expect(canGrow({ ...JAR, status: "not_an_item" })).toBe(false);
    expect(canGrow({ ...JAR, confidence: "low" })).toBe(false);
    expect(canGrow({ ...JAR, fairy: null })).toBe(false);
  });
});

describe("toGroveEntry", () => {
  it("keeps the full result and an ISO timestamp", () => {
    expect(entry("a")).toEqual({ id: "a", scannedAt: WHEN.toISOString(), result: JAR });
  });

  it("returns null for a scan that shouldn't grow", () => {
    expect(toGroveEntry(UNSURE_RESULT, WHEN, "a")).toBeNull();
  });
});

describe("parseGrove", () => {
  it("round-trips saved entries", () => {
    const saved = [entry("a"), entry("b", DEMO_RESULTS[1])];
    expect(parseGrove(JSON.stringify(saved))).toEqual(saved);
  });

  it("gives an empty Grove for missing, corrupt or non-array data", () => {
    expect(parseGrove(null)).toEqual([]);
    expect(parseGrove("{not json")).toEqual([]);
    expect(parseGrove(JSON.stringify({ entries: [] }))).toEqual([]);
  });

  it("drops only the entries that no longer match the schema", () => {
    const good = entry("a");
    const raw = JSON.stringify([good, { id: "b", scannedAt: "yesterday", result: JAR }, { id: "c" }]);
    expect(parseGrove(raw)).toEqual([good]);
  });

  it("drops saved entries that shouldn't have grown", () => {
    const raw = JSON.stringify([{ id: "a", scannedAt: WHEN.toISOString(), result: UNSURE_RESULT }]);
    expect(parseGrove(raw)).toEqual([]);
  });
});

describe("appendEntry", () => {
  it("adds to the end, oldest first", () => {
    expect(appendEntry([entry("a")], entry("b")).map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("keeps only the newest MAX_GROVE_ENTRIES", () => {
    const full = Array.from({ length: MAX_GROVE_ENTRIES }, (_, i) => entry(String(i)));
    const next = appendEntry(full, entry("new"));
    expect(next).toHaveLength(MAX_GROVE_ENTRIES);
    expect(next[0].id).toBe("1");
    expect(next.at(-1)?.id).toBe("new");
  });
});

describe("countRecyclable", () => {
  it("counts recyclable and drop-off items, not trash", () => {
    const entries = [
      entry("a", { ...JAR, recyclable: "yes" }),
      entry("b", { ...JAR, recyclable: "special_dropoff" }),
      entry("c", { ...JAR, recyclable: "no" }),
    ];
    expect(countRecyclable(entries)).toBe(2);
  });
});
