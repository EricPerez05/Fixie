// Shared pieces of the intro illustrations, ported from the onboarding mockup
// (hackathon/brand/onboarding.html). Each is an SVG group drawn around its own
// origin, so a slide places it with a transform. Colours are theme tokens only.

interface PlacedProps {
  transform?: string;
  className?: string;
}

/** A four-point sparkle, 16 units across. */
export const SPARKLE_PATH = "M0-8c.5 4 3 6.5 8 8-5 1.5-7.5 4-8 8-.5-4-3-6.5-8-8 5-1.5 7.5-4 8-8Z";

/** A glass jar with its lid on and a glint down the left side. */
export function JarArt({ transform }: PlacedProps): React.JSX.Element {
  return (
    <g transform={transform}>
      <rect x="-30" y="-78" width="60" height="18" rx="6" className="fill-honey-light stroke-ink" strokeWidth="4" />
      <path
        d="M-24-60h48v8c14 6 22 18 22 34v52a16 16 0 0 1-16 16h-60a16 16 0 0 1-16-16v-52c0-16 8-28 22-34Z"
        className="fill-[color-mix(in_srgb,var(--fairy-glass)_45%,var(--moss-deep))] stroke-ink"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M-30-14v40" className="stroke-lichen" strokeWidth="5" strokeLinecap="round" opacity=".5" />
    </g>
  );
}

/** The metal fairy: silver wings, a green body and a pale head. */
export function FairyArt({ transform }: PlacedProps): React.JSX.Element {
  return (
    <g transform={transform}>
      <g className="fill-fairy-metal stroke-ink" strokeWidth="3" strokeLinejoin="round">
        <path d="M0 0C-10-22-38-26-42-12-46 2-18 8 0 4Z" />
        <path d="M0 0C10-22 38-26 42-12 46 2 18 8 0 4Z" />
        <path d="M-1 6C-12 12-24 30-16 34-8 38-2 18 1 8Z" />
        <path d="M1 6C12 12 24 30 16 34 8 38 2 18-1 8Z" />
      </g>
      <path
        d="M0-4C6 8 6 26 0 38-6 26-6 8 0-4Z"
        className="fill-moss stroke-ink"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cy="-12" r="10" className="fill-paper stroke-ink" strokeWidth="3" />
    </g>
  );
}

/** A firefly as a glowing sparkle: the sparkle inside two soft halos. */
export function FireflyArt({ transform }: PlacedProps): React.JSX.Element {
  return (
    <g transform={transform} className="fill-glimmer-bright">
      <circle r="10" opacity=".18" />
      <circle r="6" opacity=".28" />
      <path d={SPARKLE_PATH} />
    </g>
  );
}

/** A soft, lighter disc behind each illustration. */
export function ArtHalo(): React.JSX.Element {
  return <circle r="118" className="fill-lichen/5" />;
}
