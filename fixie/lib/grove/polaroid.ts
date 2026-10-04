import type { GroveBranch, Point } from "./layout";

/*
 * Where each branch's label and polaroid sit, relative to its leaf cluster.
 * Pure, so the "doesn't cover its neighbours" promise is unit-tested rather
 * than eyeballed. All values are in tree px (1 tree unit = 1 CSS px).
 */

/** The label is centred under its leaf cluster but kept on screen. */
export const LABEL_WIDTH = 148;
/** The label button's top edge, relative to the cluster centre (tip.y). */
export const LABEL_TOP = -40;
/** Empty space above the label text that covers the leaf cluster, for a branch with no photo. */
export const CLUSTER_SPACE = 74;

export const POLAROID = {
  width: 56,
  height: 66,
  /** Cream border on the sides and top; the bottom margin holds the item name. */
  border: 4,
  bottom: 14,
  /** The string it hangs from, starting just under the cluster centre. */
  string: 12,
  hookBelowTip: 6,
} as const;

const MAX_TILT_DEG = 8;
// How far a tilted polaroid's corners can drop below its untilted bottom
// edge: (1 - cos 8°) * 66 + sin 8° * 28 ≈ 4.5px, rounded up.
const TILT_OVERHANG = 5;
const SCREEN_EDGE = 4;
const LABEL_GAP = 4;

/** Keeps a label on screen. Returns its left edge. */
export function labelLeft(x: number, width: number): number {
  return Math.max(SCREEN_EDGE, Math.min(width - LABEL_WIDTH - SCREEN_EDGE, x - LABEL_WIDTH / 2));
}

/** A tilt between -8° and 8°, the same for the same id on every render and device. */
export function polaroidTilt(id: string): number {
  // FNV-1a: tiny, deterministic and spreads short ids well.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unit = (hash >>> 0) / 0xffffffff;
  return Math.round((unit * 2 - 1) * MAX_TILT_DEG * 10) / 10;
}

export interface PolaroidAnchor {
  /** Where the string is tied, under the leaf cluster. The polaroid swings from here. */
  hook: Point;
  /** The untilted frame's top-left corner. */
  left: number;
  top: number;
  tilt: number;
}

/**
 * Hangs a polaroid from a branch: centred under the leaf cluster on a short
 * string, kept fully on screen. The branch's label then moves down below it
 * (see labelSpace), so nothing covers the label.
 */
export function polaroidAnchor(branch: Pick<GroveBranch, "tip">, width: number, id: string): PolaroidAnchor {
  const left = Math.max(
    SCREEN_EDGE,
    Math.min(width - POLAROID.width - SCREEN_EDGE, branch.tip.x - POLAROID.width / 2),
  );
  const hookY = branch.tip.y + POLAROID.hookBelowTip;
  return {
    hook: { x: left + POLAROID.width / 2, y: hookY },
    left,
    top: hookY + POLAROID.string,
    tilt: polaroidTilt(id),
  };
}

/**
 * Height of the space above a label's text: the leaf cluster, plus the
 * polaroid when the branch has one, so the text always starts below it.
 */
export function labelSpace(hasPhoto: boolean): number {
  if (!hasPhoto) return CLUSTER_SPACE;
  const polaroidBottom = POLAROID.hookBelowTip + POLAROID.string + POLAROID.height + TILT_OVERHANG;
  return polaroidBottom + LABEL_GAP - LABEL_TOP;
}

/** The box a hanging polaroid can occupy at any tilt, for overlap checks. */
export function polaroidBounds(anchor: PolaroidAnchor): { left: number; top: number; right: number; bottom: number } {
  const swing = Math.sin((MAX_TILT_DEG * Math.PI) / 180) * (POLAROID.string + POLAROID.height);
  return {
    left: anchor.left - swing,
    top: anchor.hook.y,
    right: anchor.left + POLAROID.width + swing,
    bottom: anchor.top + POLAROID.height + TILT_OVERHANG,
  };
}
