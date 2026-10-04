// "Fixie" in Fraunces Bold, with the first "i" as an open jar and a firefly
// for the dot of the second. Drawn on a 32px em: baseline at y=27, exactly as
// the approved mockup (hackathon/brand/logo-wordmark.html) lays it out at the
// top bar's 32px. Fixed geometry, so it needs no web font and no measuring.

// Letter outlines from Fraunces Bold (SIL Open Font License) at the 32px
// optical size, already placed at their pen positions with -0.02em tracking.
const F =
  "M14.29 4.6Q14.93 4.6 15.36 4.46Q15.8 4.32 16.15 4.2Q16.5 4.08 16.85 4.08Q17.41 4.08 17.71 4.36Q18 4.64 18.19 5.34L19.56 10.28Q19.68 10.68 19.46 10.95Q19.24 11.23 18.82 11.28Q18.5 11.34 18.18 11.21Q17.87 11.08 17.65 10.66Q16.76 8.9 15.96 7.97Q15.17 7.05 14.33 6.71Q13.49 6.37 12.45 6.37H9.91V24.14Q9.91 24.5 10.1 24.74Q10.28 24.99 10.71 25.06L11.97 25.27Q12.39 25.34 12.57 25.55Q12.75 25.77 12.75 26.17Q12.75 26.56 12.49 26.78Q12.23 27 11.69 27H2.55Q2.01 27 1.75 26.78Q1.49 26.56 1.49 26.17Q1.49 25.51 2.19 25.27L2.99 25.06Q3.38 24.93 3.58 24.71Q3.77 24.5 3.77 24.14V7.46Q3.77 7.1 3.58 6.89Q3.38 6.67 2.99 6.54L2.19 6.33Q1.49 6.09 1.49 5.43Q1.49 5.03 1.75 4.81Q2.01 4.6 2.55 4.6ZM7.7 15.37H12.31Q13.37 15.37 13.83 14.95Q14.3 14.53 14.61 13.27Q14.73 12.9 14.94 12.74Q15.16 12.58 15.46 12.57Q16.18 12.55 16.35 13.26L17.57 18.31Q17.69 18.76 17.55 19.01Q17.42 19.27 17.1 19.38Q16.75 19.5 16.45 19.39Q16.14 19.29 15.88 18.93Q15.39 18.2 14.98 17.81Q14.58 17.41 14.06 17.25Q13.55 17.1 12.75 17.1H7.7Z";
const X =
  "M35.98 18.78 37.35 19.48 34.39 23.49Q33.88 24.2 33.98 24.68Q34.07 25.16 34.66 25.39L35.08 25.53Q35.38 25.64 35.51 25.81Q35.65 25.97 35.65 26.24Q35.65 26.58 35.4 26.78Q35.16 26.98 34.73 26.98H30.36Q29.93 26.98 29.68 26.78Q29.43 26.58 29.43 26.24Q29.43 25.98 29.59 25.8Q29.74 25.62 30.12 25.43Q30.65 25.22 31.04 24.92Q31.44 24.61 31.87 24.12Q32.3 23.62 32.89 22.85ZM37.95 14.51 40.76 18.47 40.98 18.72 44.92 24.06Q45.4 24.73 45.72 25.03Q46.03 25.34 46.36 25.48Q46.67 25.64 46.8 25.81Q46.93 25.99 46.93 26.25Q46.93 26.6 46.67 26.8Q46.42 27 45.98 27H38.27Q37.8 27 37.56 26.8Q37.31 26.59 37.31 26.23Q37.31 25.99 37.43 25.82Q37.54 25.65 37.8 25.56L38.3 25.45Q38.74 25.33 38.78 25.06Q38.83 24.78 38.47 24.29L35.62 20.24L35.39 19.97L31.66 14.6Q31.28 14.05 30.94 13.8Q30.59 13.55 30.21 13.42Q29.84 13.28 29.71 13.09Q29.58 12.9 29.58 12.61Q29.58 12.24 29.83 12.04Q30.08 11.84 30.53 11.84H38.05Q38.47 11.84 38.72 12.03Q38.97 12.23 38.97 12.59Q38.97 12.82 38.87 12.98Q38.77 13.15 38.56 13.28L38.08 13.45Q37.71 13.62 37.68 13.85Q37.66 14.09 37.95 14.51ZM40.24 19.97 38.85 19.26 41.74 15.35Q42.25 14.63 42.16 14.12Q42.07 13.6 41.47 13.41L41.04 13.29Q40.76 13.16 40.62 12.99Q40.48 12.82 40.48 12.59Q40.48 12.23 40.74 12.03Q40.99 11.84 41.42 11.84H45.78Q46.21 11.84 46.45 12.03Q46.69 12.23 46.69 12.59Q46.69 12.83 46.54 13.01Q46.4 13.19 46.02 13.39Q45.24 13.69 44.68 14.26Q44.13 14.82 43.22 15.98Z";
const DOTLESS_I =
  "M54.66 12.3V24.25Q54.66 24.78 54.79 25.01Q54.93 25.25 55.18 25.36L55.66 25.52Q55.94 25.63 56.08 25.82Q56.23 26.01 56.23 26.28Q56.23 26.61 55.99 26.81Q55.74 27 55.31 27H48.54Q48.11 27 47.87 26.81Q47.62 26.61 47.62 26.28Q47.62 26.01 47.77 25.82Q47.91 25.63 48.18 25.52L48.71 25.36Q48.94 25.25 49.06 25.02Q49.19 24.79 49.19 24.27V15.47Q49.19 15.05 49.06 14.88Q48.94 14.72 48.68 14.65L48.06 14.59Q47.8 14.49 47.66 14.35Q47.52 14.2 47.52 13.94Q47.52 13.65 47.71 13.47Q47.9 13.29 48.3 13.14L52.29 11.82Q52.83 11.63 53.15 11.55Q53.48 11.47 53.84 11.47Q54.22 11.47 54.44 11.7Q54.66 11.92 54.66 12.3Z";
const E =
  "M72.59 17.57Q72.59 18.47 72.1 18.95Q71.6 19.44 70.66 19.44H60.89V18.12H66.3Q67.08 18.12 67.08 17.39Q67.08 15.22 66.46 14.2Q65.84 13.17 64.82 13.17Q64.06 13.17 63.47 13.68Q62.87 14.19 62.52 15.21Q62.18 16.24 62.18 17.74Q62.18 20.78 63.56 22.25Q64.94 23.71 67.26 23.71Q68.55 23.71 69.54 23.25Q70.53 22.79 71.15 21.83Q71.49 21.5 71.68 21.38Q71.87 21.27 72.05 21.27Q72.31 21.27 72.43 21.52Q72.54 21.77 72.54 22.11Q72.51 23.54 71.59 24.75Q70.67 25.96 69.06 26.68Q67.46 27.4 65.35 27.4Q63 27.4 61.16 26.45Q59.33 25.5 58.27 23.78Q57.21 22.07 57.21 19.78Q57.21 17.28 58.2 15.4Q59.2 13.52 61.07 12.47Q62.95 11.42 65.56 11.42Q67.82 11.42 69.4 12.21Q70.97 13 71.78 14.39Q72.59 15.78 72.59 17.57Z";

const TONES = {
  dark: {
    letters: "fill-lichen",
    firefly: "fill-glimmer-bright",
    path: "stroke-glimmer-bright",
    glint: "stroke-moss-deep",
  },
  light: { letters: "fill-ink", firefly: "fill-honey", path: "stroke-honey", glint: "stroke-cream" },
} as const;

interface WordmarkProps {
  /** "dark" over the forest-green screens, "light" over cream. */
  tone: "dark" | "light";
  /** Sizing; by default the letters are 32px, like the top bar. */
  className?: string;
  /** Hide it from screen readers when its container already says "Fixie", such as a labelled button. */
  isDecorative?: boolean;
}

export function Wordmark({ tone, className, isDecorative = false }: WordmarkProps): React.JSX.Element {
  const colors = TONES[tone];
  const a11y = isDecorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Fixie" };
  return (
    <svg viewBox="0 0 73 32" width={73} height={32} className={className} {...a11y}>
      <g className={colors.letters}>
        <path d={F} />
        <path d={X} />
        <path d={DOTLESS_I} />
        <path d={E} />
        {/* The first "i": a skinny jar with its lid tipped open where the dot would be. */}
        <g transform="translate(21.28 4.28) scale(.8858)">
          <rect x=".5" y="2.2" width="6" height="2.2" rx=".8" transform="rotate(-24 .5 4.4)" />
          <path d="M1.6 7.6h3.8v1c1 .5 1.4 1.3 1.4 2.4v12.4A2.6 2.6 0 0 1 4.2 26H2.8A2.6 2.6 0 0 1 .2 23.4V11c0-1.1.4-1.9 1.4-2.4Z" />
          <path d="M1.9 12.6v7.2" className={colors.glint} strokeWidth=".9" strokeLinecap="round" opacity=".55" />
        </g>
      </g>
      {/* Its flight path, from the open lid over the "x" to the firefly. */}
      <path
        d="M25.13 7.05Q37.07-1.78 49.01 5.9"
        className={colors.path}
        fill="none"
        strokeWidth="1.2"
        strokeDasharray=".64 2.24"
        strokeLinecap="round"
      />
      {/* The firefly, as the dot of the dotless "ı": a sparkle in two soft glows. */}
      <g className={colors.firefly} transform="translate(52.41 6.88) scale(.5065)">
        <circle r="10" opacity=".18" />
        <circle r="6" opacity=".25" />
        <path d="M0-8c.5 4 3 6.5 8 8-5 1.5-7.5 4-8 8-.5-4-3-6.5-8-8 5-1.5 7.5-4 8-8Z" />
      </g>
    </svg>
  );
}
