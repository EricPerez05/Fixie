import type { Fairy as FairyKind } from "@/lib/scan/schema";

interface FairyProfile {
  name: string;
  title: string;
  /** Literal class names so Tailwind can see them at build time. */
  wingClass: string;
  badgeClass: string;
}

export const FAIRIES: Record<FairyKind, FairyProfile> = {
  glass: { name: "Glint", title: "the glass fairy", wingClass: "fill-fairy-glass", badgeClass: "bg-fairy-glass" },
  paper: { name: "Folio", title: "the paper sprite", wingClass: "fill-fairy-paper", badgeClass: "bg-fairy-paper" },
  metal: { name: "Rivet", title: "the metal tinker", wingClass: "fill-fairy-metal", badgeClass: "bg-fairy-metal" },
  plastic: { name: "Polly", title: "the plastic pixie", wingClass: "fill-fairy-plastic", badgeClass: "bg-fairy-plastic" },
  textile: { name: "Thimble", title: "the cloth fairy", wingClass: "fill-fairy-textile", badgeClass: "bg-fairy-textile" },
  organic: { name: "Sprout", title: "the garden sprite", wingClass: "fill-fairy-organic", badgeClass: "bg-fairy-organic" },
  electronic: { name: "Spark", title: "the circuit fairy", wingClass: "fill-fairy-electronic", badgeClass: "bg-fairy-electronic" },
  mixed: { name: "Bodkin", title: "the odds-and-ends fairy", wingClass: "fill-fairy-mixed", badgeClass: "bg-fairy-mixed" },
};

interface FairyProps {
  /** null means nobody could identify the item; a sleepy grey fairy shows up. */
  kind: FairyKind | null;
  /** Pixels, or a CSS length like "100%" to fill a sized wrapper. */
  size?: number | string;
}

/**
 * Placeholder fairy: a flat SVG in the material's colour. Swap the <svg> for
 * a Rive/Lottie character later; the props and colour mapping stay the same.
 */
export function Fairy({ kind, size = 88 }: FairyProps): React.JSX.Element {
  const wingClass = kind ? FAIRIES[kind].wingClass : "fill-fairy-mixed";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      <g className={`${wingClass} stroke-ink`} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M46 46 C 26 18, 4 26, 12 44 C 18 56, 34 54, 46 50 Z" />
        <path d="M50 46 C 70 18, 92 26, 84 44 C 78 56, 62 54, 50 50 Z" />
        <path d="M46 52 C 30 58, 20 74, 32 78 C 40 80, 44 66, 47 56 Z" opacity="0.85" />
        <path d="M50 52 C 66 58, 76 74, 64 78 C 56 80, 52 66, 49 56 Z" opacity="0.85" />
      </g>
      <g className="stroke-ink" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M48 44 C 42 54, 42 70, 48 80 C 54 70, 54 54, 48 44 Z" className="fill-moss" />
        <circle cx="48" cy="34" r="9" className="fill-lichen" />
      </g>
      <path
        d="M78 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"
        className="fill-glimmer stroke-ink"
        strokeWidth="1.5"
      />
    </svg>
  );
}
