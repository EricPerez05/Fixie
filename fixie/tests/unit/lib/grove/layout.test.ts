import { describe, expect, it } from "vitest";
import { layoutGrove } from "@/lib/grove/layout";

const PHONE = { width: 390, minHeight: 700, topInset: 110 };

describe("layoutGrove", () => {
  it("draws a seedling with no branches that fills the screen", () => {
    const layout = layoutGrove({ ...PHONE, count: 0 });
    expect(layout.branches).toHaveLength(0);
    expect(layout.height).toBe(PHONE.minHeight);
    expect(layout.crown.y).toBeGreaterThan(PHONE.topInset);
  });

  it("gets taller with every branch once it outgrows the screen", () => {
    const heights = [20, 21, 40].map((count) => layoutGrove({ ...PHONE, count }).height);
    expect(heights[1] - heights[0]).toBe(104);
    expect(heights[2]).toBeGreaterThan(heights[1]);
  });

  it("puts the newest branch at the top and the oldest near the roots", () => {
    const { branches, groundY, crown } = layoutGrove({ ...PHONE, count: 12 });
    const ys = branches.map((b) => b.joint.y);
    expect([...ys].sort((a, b) => b - a)).toEqual(ys);
    expect(ys.at(-1)).toBeGreaterThan(crown.y);
    expect(ys[0]).toBeLessThan(groundY);
  });

  it("alternates sides so neighbouring labels never collide", () => {
    const { branches } = layoutGrove({ ...PHONE, count: 6 });
    expect(branches.map((b) => b.side)).toEqual([-1, 1, -1, 1, -1, 1]);
  });

  it("keeps a branch on the same side as more grow above it", () => {
    const before = layoutGrove({ ...PHONE, count: 5 }).branches[2].side;
    const after = layoutGrove({ ...PHONE, count: 30 }).branches[2].side;
    expect(after).toBe(before);
  });

  it("keeps every leaf cluster on screen at a 375px width", () => {
    const { branches } = layoutGrove({ ...PHONE, width: 375, count: 10 });
    for (const branch of branches) {
      for (const blob of branch.canopy) {
        expect(blob.cx - blob.r).toBeGreaterThanOrEqual(0);
        expect(blob.cx + blob.r).toBeLessThanOrEqual(375);
      }
    }
  });

  it("is deterministic, so re-renders don't reshuffle the tree", () => {
    expect(layoutGrove({ ...PHONE, count: 8 })).toEqual(layoutGrove({ ...PHONE, count: 8 }));
  });
});
