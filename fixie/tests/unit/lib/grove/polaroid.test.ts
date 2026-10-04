import { describe, expect, it } from "vitest";
import { layoutGrove } from "@/lib/grove/layout";
import {
  CLUSTER_SPACE,
  LABEL_TOP,
  LABEL_WIDTH,
  labelLeft,
  labelSpace,
  polaroidAnchor,
  polaroidBounds,
  polaroidTilt,
  POLAROID,
} from "@/lib/grove/polaroid";

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// Two lines of item name and the date line under it.
const LABEL_TEXT_HEIGHT = 56;

describe("polaroidTilt", () => {
  it("stays within -8° and 8°", () => {
    for (let i = 0; i < 500; i++) {
      const tilt = polaroidTilt(`entry-${i}`);
      expect(tilt).toBeGreaterThanOrEqual(-8);
      expect(tilt).toBeLessThanOrEqual(8);
    }
  });

  it("is the same for the same id and varies between ids", () => {
    expect(polaroidTilt("abc")).toBe(polaroidTilt("abc"));
    const tilts = new Set(Array.from({ length: 20 }, (_, i) => polaroidTilt(`id-${i}`)));
    expect(tilts.size).toBeGreaterThan(10);
  });
});

describe("polaroidAnchor", () => {
  for (const width of [320, 375, 390, 430]) {
    const layout = layoutGrove({ count: 9, width, minHeight: 700, topInset: 96 });
    const ids = layout.branches.map((_, i) => `entry-${i}`);
    const anchors = layout.branches.map((branch, i) => polaroidAnchor(branch, width, ids[i]));
    const polaroids = anchors.map(polaroidBounds);
    const labels: Box[] = layout.branches.map((branch) => {
      const left = labelLeft(branch.tip.x, width);
      const top = branch.tip.y + LABEL_TOP + labelSpace(true);
      return { left, right: left + LABEL_WIDTH, top, bottom: top + LABEL_TEXT_HEIGHT };
    });
    // The leaf cluster: canopy blobs reach about 37px out and 34px up from the tip.
    const clusters: Box[] = layout.branches.map(({ tip }) => ({
      left: tip.x - 37,
      right: tip.x + 37,
      top: tip.y - 34,
      bottom: tip.y + 20,
    }));

    it(`hangs every polaroid on screen at ${width}px`, () => {
      for (const anchor of anchors) {
        expect(anchor.left).toBeGreaterThanOrEqual(0);
        expect(anchor.left + POLAROID.width).toBeLessThanOrEqual(width);
      }
    });

    it(`never covers a label, or another branch's polaroid or leaves, at ${width}px`, () => {
      polaroids.forEach((polaroid, i) => {
        labels.forEach((label) => expect(overlaps(polaroid, label)).toBe(false));
        polaroids.forEach((other, j) => i !== j && expect(overlaps(polaroid, other)).toBe(false));
        clusters.forEach((cluster, j) => i !== j && expect(overlaps(polaroid, cluster)).toBe(false));
      });
    });

    it(`keeps labels clear of each other at ${width}px`, () => {
      labels.forEach((label, i) => labels.forEach((other, j) => i !== j && expect(overlaps(label, other)).toBe(false)));
    });
  }
});

describe("labelSpace", () => {
  it("keeps the old spacing for a branch with no photo, and drops below the polaroid otherwise", () => {
    expect(labelSpace(false)).toBe(CLUSTER_SPACE);
    expect(labelSpace(true)).toBeGreaterThan(CLUSTER_SPACE);
  });
});
