/*
 * Geometry for the Grove tree. Pure: numbers in, SVG path strings and
 * positions out, so it can be unit-tested and the component only draws.
 *
 * The tree grows upward. The crown sits at the top, the newest branch just
 * under it, and older branches step down the trunk to the roots. Each scan
 * adds SPACING px of height, so the screen scrolls further as the Grove grows.
 */

export interface Point {
  x: number;
  y: number;
}

export type LeafTone = "moss" | "leaf" | "fern" | "bright";

export interface Blob {
  cx: number;
  cy: number;
  r: number;
  tone: LeafTone;
}

export interface Leaf {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

export interface GroveBranch {
  /** -1 grows left, 1 grows right. */
  side: -1 | 1;
  /** Where it leaves the trunk; the grow animation scales from here. */
  joint: Point;
  /** Centre of the leaf cluster at its end. */
  tip: Point;
  path: string;
  twigPath: string;
  leaves: Leaf[];
  canopy: Blob[];
}

export interface Firefly {
  /** Percent of the width. */
  x: number;
  y: number;
  size: number;
  seconds: number;
  delay: number;
  opacity: number;
}

export interface GroveLayout {
  width: number;
  height: number;
  centerX: number;
  groundY: number;
  crown: Point;
  trunkPath: string;
  /** A thin highlight down the lit side of the trunk. */
  rimPath: string;
  barkLines: string[];
  roots: string[];
  grass: string[];
  crownCanopy: Blob[];
  /** Oldest first, matching the entries. */
  branches: GroveBranch[];
  /** The dashed "next scan grows here" branch. */
  bud: { path: string; tip: Point };
  fireflies: Firefly[];
}

interface LayoutInput {
  count: number;
  width: number;
  /** The tree fills at least this much, with the roots at the bottom. */
  minHeight: number;
  /** Space kept clear at the top for the header that floats over the tree. */
  topInset: number;
}

const SPACING = 104;
const CROWN_TO_NEWEST = 150;
const OLDEST_TO_GROUND = 96;
const SEEDLING_TRUNK = 230;
const CROWN_HEADROOM = 70;
const BUD_BELOW_CROWN = 74;
const GROUND_DEPTH = 60;

/** Deterministic noise in [0, 1), so the same tree draws the same way every render. */
function noise(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function round(value: number): string {
  return value.toFixed(1);
}

function bezier(p0: Point, p1: Point, p2: Point, p3: Point, steps: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    points.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return points;
}

/** A filled outline around a centre line, `widthAt(t)` wide at each point (t from 0 to 1). */
function taper(points: Point[], widthAt: (t: number) => number): string {
  const left: string[] = [];
  const right: string[] = [];
  const last = points.length - 1;
  points.forEach((point, i) => {
    const before = points[Math.max(i - 1, 0)];
    const after = points[Math.min(i + 1, last)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const half = widthAt(i / last) / 2;
    const nx = (-dy / length) * half;
    const ny = (dx / length) * half;
    left.push(`${round(point.x + nx)} ${round(point.y + ny)}`);
    right.push(`${round(point.x - nx)} ${round(point.y - ny)}`);
  });
  return `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
}

function polyline(points: Point[]): string {
  return `M${points.map((p) => `${round(p.x)} ${round(p.y)}`).join(" L")}`;
}

const CANOPY: readonly [number, number, number][] = [
  [0, -8, 20],
  [-17, 1, 14],
  [17, -1, 15],
  [-9, -21, 13],
  [11, -20, 13],
  [0, 7, 13],
];
const BRANCH_TONES: readonly LeafTone[] = ["moss", "leaf", "fern", "leaf", "bright", "moss"];
const CROWN_TONES: readonly LeafTone[] = ["fern", "bright", "leaf", "bright", "bright", "fern"];

function canopy(center: Point, seed: number, scale: number, tones: readonly LeafTone[]): Blob[] {
  return CANOPY.map(([dx, dy, r], i) => ({
    cx: center.x + (dx + (noise(seed + i) - 0.5) * 4) * scale,
    cy: center.y + (dy + (noise(seed + i + 9) - 0.5) * 4) * scale,
    r: r * scale,
    tone: tones[i],
  }));
}

/** Lays out a tree with `count` branches. Never throws; a count of 0 gives a seedling. */
export function layoutGrove({ count, width, minHeight, topInset }: LayoutInput): GroveLayout {
  const centerX = width / 2;
  const reach = Math.min(width * 0.3, 118);

  const trunkLength = count > 0 ? CROWN_TO_NEWEST + (count - 1) * SPACING + OLDEST_TO_GROUND : SEEDLING_TRUNK;
  const height = Math.max(minHeight, topInset + CROWN_HEADROOM + trunkLength + GROUND_DEPTH);
  const groundY = height - GROUND_DEPTH;
  const crownY = groundY - trunkLength;

  // The trunk thickens as the tree grows, and sways gently along its length.
  const girth = Math.min(1, 0.42 + count / 26);
  const trunkX = (t: number): number => centerX + 7 * Math.sin((t * trunkLength) / 210 + 0.6) * Math.min(1, t * 4);
  const trunkWidth = (t: number): number =>
    40 * girth * Math.pow(1 - t, 0.75) + 8 + (22 * girth * Math.max(0, 0.05 - t)) / 0.05;
  const tAt = (y: number): number => (groundY - y) / trunkLength;

  const trunkPoints: Point[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    trunkPoints.push({ x: trunkX(t), y: groundY - t * trunkLength });
  }
  const rimPath = polyline(
    trunkPoints.slice(4, 77).map((p, i) => ({ x: p.x + trunkWidth((i + 4) / 80) / 2 - 2.5, y: p.y })),
  );

  const barkLines: string[] = [];
  for (let k = 0; k < Math.floor(trunkLength / 70); k++) {
    const t = 0.06 + noise(k + 100) * 0.8;
    const w = trunkWidth(t);
    if (w < 12) continue;
    const x = trunkX(t) + (noise(k + 200) - 0.5) * w * 0.4;
    barkLines.push(`M${round(x)} ${round(groundY - t * trunkLength)} q2 -9 0 -18`);
  }

  const rootScale = 0.55 + girth * 0.45;
  const roots = [-1, -0.45, 0.4, 0.95].map((k, i) => {
    const end = { x: centerX + k * 78 * rootScale, y: groundY + 26 + noise(i) * 8 };
    const points = bezier(
      { x: centerX + k * 8, y: groundY - 6 },
      { x: centerX + k * 22, y: groundY + 10 },
      { x: end.x - k * 30, y: end.y - 6 },
      end,
      18,
    );
    return taper(points, (t) => (12 * girth + 3) * (1 - t) + 1.5);
  });

  const grass = Array.from({ length: 9 }, (_, i) => {
    const x = centerX + (i - 4) * width * 0.075 + (noise(i + 40) - 0.5) * 10;
    const y = groundY + 26 + Math.abs(i - 4) * 2;
    return `M${round(x - 4)} ${round(y)} Q${round(x - 3)} ${round(y - 9)} ${round(x - 6)} ${round(y - 14)} M${round(x)} ${round(y)} Q${round(x + 1)} ${round(y - 12)} ${round(x)} ${round(y - 17)} M${round(x + 4)} ${round(y)} Q${round(x + 4)} ${round(y - 8)} ${round(x + 7)} ${round(y - 12)}`;
  });

  const branches: GroveBranch[] = Array.from({ length: count }, (_, i) => {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const y = crownY + CROWN_TO_NEWEST + (count - 1 - i) * SPACING;
    const t = tAt(y);
    const jointX = trunkX(t);
    const trunkW = trunkWidth(t);
    const tip = { x: centerX + side * reach, y: y - 42 };
    const points = bezier(
      { x: jointX - side * trunkW * 0.2, y: y + 5 },
      { x: jointX + side * 46, y: y - 2 },
      { x: tip.x - side * 36, y: tip.y + 24 },
      tip,
      22,
    );
    const baseWidth = Math.min(15, trunkW * 0.6);
    const mid = points[11];
    const twigEnd = { x: mid.x + side * 12, y: mid.y - 26 };
    const twig = bezier(
      mid,
      { x: mid.x + side * 2, y: mid.y - 10 },
      { x: twigEnd.x - side * 4, y: twigEnd.y + 8 },
      twigEnd,
      10,
    );
    return {
      side,
      joint: { x: jointX, y },
      tip,
      path: taper(points, (u) => baseWidth * (1 - u) + 2.5),
      twigPath: taper(twig, (u) => 4.5 * (1 - u) + 1),
      leaves: [
        { ...twigEnd, rotate: side > 0 ? -55 : -125, scale: 1 },
        { ...points[6], rotate: side > 0 ? 35 : 145, scale: 0.8 },
      ],
      canopy: canopy(tip, i * 7, 1, BRANCH_TONES),
    };
  });

  const budSide: -1 | 1 = count % 2 === 0 ? -1 : 1;
  const budY = crownY + BUD_BELOW_CROWN;
  const budJointX = trunkX(tAt(budY));
  const budTip = { x: centerX + budSide * (reach - 6), y: budY - 34 };
  const bud = {
    tip: budTip,
    path: polyline(
      bezier(
        { x: budJointX, y: budY },
        { x: budJointX + budSide * 40, y: budY - 2 },
        { x: budTip.x - budSide * 30, y: budTip.y + 18 },
        budTip,
        20,
      ),
    ),
  };

  const crown = { x: trunkX(1), y: crownY };

  // Sparse, and kept to the edges so they never sit on the tree.
  const fireflies: Firefly[] = Array.from({ length: Math.max(4, Math.round(height / 200)) }, (_, k) => ({
    x: k % 2 === 0 ? 4 + noise(k + 300) * 14 : 82 + noise(k + 300) * 14,
    y: topInset + noise(k + 400) * (height - topInset - GROUND_DEPTH * 2),
    size: 3 + Math.round(noise(k + 500) * 2),
    seconds: 2.6 + noise(k + 700) * 1.8,
    delay: -noise(k + 800) * 3,
    opacity: 0.45 + noise(k + 600) * 0.4,
  }));

  return {
    width,
    height,
    centerX,
    groundY,
    crown,
    trunkPath: taper(trunkPoints, trunkWidth),
    rimPath,
    barkLines,
    roots,
    grass,
    crownCanopy: canopy({ x: crown.x, y: crownY - 4 }, 999, 1.5, CROWN_TONES),
    branches,
    bud,
    fireflies,
  };
}
