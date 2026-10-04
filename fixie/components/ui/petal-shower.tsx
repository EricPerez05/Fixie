import type { CSSProperties } from "react";

type Shape = "bloom" | "bloom-pale" | "petal";

interface Blossom {
  shape: Shape;
  /** Horizontal start, as a percentage of the screen width. */
  x: number;
  /** Size in px. */
  size: number;
  opacity: number;
  /** Seconds to fall the full height of the screen. */
  fall: number;
  /** Negative, so the screen is already mid-shower on the first frame. */
  delay: number;
  /** Seconds for one sway left-to-right. */
  sway: number;
  /** Sway distance in px. */
  drift: number;
  /** Where it rests when motion is reduced, as a percentage of the height. */
  rest: number;
  /** Small blur on the "far away" ones, for depth. */
  blur?: number;
}

// Five full blooms that drift slowly, plus six loose petals that fall faster
// and flutter more (the "petal shower" option from the Fixie Blossoms mockup).
// Opacity stays around 0.4-0.6: pink is close to the opposite of this green,
// so below that it averages out to grey-green instead of a faint pink.
const BLOSSOMS: readonly Blossom[] = [
  { shape: "bloom", x: 8, size: 34, opacity: 0.55, fall: 22, delay: -3, sway: 5, drift: 16, rest: 14 },
  { shape: "bloom-pale", x: 70, size: 26, opacity: 0.48, fall: 26, delay: -14, sway: 6, drift: 14, rest: 30 },
  { shape: "bloom", x: 84, size: 36, opacity: 0.52, fall: 20, delay: -9, sway: 5, drift: 18, rest: 58 },
  { shape: "bloom-pale", x: 20, size: 22, opacity: 0.42, fall: 28, delay: -17, sway: 5, drift: 14, rest: 72, blur: 1 },
  { shape: "bloom-pale", x: 56, size: 28, opacity: 0.5, fall: 24, delay: -1, sway: 5, drift: 14, rest: 86 },
  { shape: "petal", x: 36, size: 9, opacity: 0.6, fall: 16, delay: -5, sway: 3.5, drift: 22, rest: 20 },
  { shape: "petal", x: 62, size: 8, opacity: 0.55, fall: 18, delay: -12, sway: 4, drift: 20, rest: 40 },
  { shape: "petal", x: 12, size: 10, opacity: 0.58, fall: 15, delay: -8, sway: 3, drift: 24, rest: 52 },
  { shape: "petal", x: 90, size: 8, opacity: 0.5, fall: 17, delay: -2, sway: 4.5, drift: 18, rest: 78 },
  { shape: "petal", x: 46, size: 9, opacity: 0.55, fall: 19, delay: -15, sway: 3.8, drift: 20, rest: 94 },
  { shape: "petal", x: 76, size: 7, opacity: 0.48, fall: 14, delay: -10, sway: 3.2, drift: 22, rest: 6 },
];

const OUTER_PETAL = "M0 0 C-5.6 -3 -5 -9.6 0 -10.2 C5 -9.6 5.6 -3 0 0 Z";
const INNER_PETAL = "M0 0 C-3.4 -2 -3 -6.2 0 -6.6 C3 -6.2 3.4 -2 0 0 Z";

/** A full two-layer bloom: five outer petals, five inner ones between them. */
function Bloom({ isPale }: { isPale: boolean }): React.JSX.Element {
  const outer = isPale ? "fill-blossom-light" : "fill-blossom";
  const inner = isPale ? "fill-blossom" : "fill-blossom-light";
  return (
    <svg viewBox="-11 -11 22 22" className="block h-full w-full">
      <g className={outer}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d={OUTER_PETAL} transform={`rotate(${angle})`} />
        ))}
      </g>
      <g className={inner}>
        {[36, 108, 180, 252, 324].map((angle) => (
          <path key={angle} d={INNER_PETAL} transform={`rotate(${angle})`} />
        ))}
      </g>
      <circle r="2.1" className={isPale ? "fill-blossom-deep" : "fill-glimmer"} />
    </svg>
  );
}

function Petal(): React.JSX.Element {
  return (
    <svg viewBox="-5 -7 10 14" className="block h-full w-full">
      <path d="M0 -6 C4 -3 3 4 0 6 C-3 4 -4 -3 0 -6 Z" className="fill-blossom-light" />
    </svg>
  );
}

function blossomStyle(blossom: Blossom): CSSProperties {
  return {
    left: `${blossom.x}%`,
    width: blossom.size,
    height: blossom.size * (blossom.shape === "petal" ? 1.4 : 1),
    opacity: blossom.opacity,
    filter: blossom.blur ? `blur(${blossom.blur}px)` : undefined,
    // Read by .blossom-fall / .blossom-sway in globals.css.
    ["--fall-time" as string]: `${blossom.fall}s`,
    ["--fall-delay" as string]: `${blossom.delay}s`,
    ["--sway-time" as string]: `${blossom.sway}s`,
    ["--drift" as string]: `${blossom.drift}px`,
    ["--rest" as string]: `${blossom.rest}%`,
  };
}

/**
 * Faint pink blossoms falling through the start screen's background.
 * Purely decorative: hidden from screen readers and never tappable. Must be
 * rendered inside the size-container <main>, which its fall distance (cqh)
 * measures against. With reduced motion it rests in place.
 */
export function PetalShower(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
      {BLOSSOMS.map((blossom, index) => (
        <span key={index} className="blossom-fall" style={blossomStyle(blossom)}>
          <span className="blossom-sway">
            {blossom.shape === "petal" ? <Petal /> : <Bloom isPale={blossom.shape === "bloom-pale"} />}
          </span>
        </span>
      ))}
    </div>
  );
}
