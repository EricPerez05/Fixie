import { ArtHalo, FairyArt, JarArt, SPARKLE_PATH } from "./art-parts";

/** Intro screen 2: a jar in the camera's scan frame, a fairy, and the verdict chip. */
export function SnapItArt({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="-150 -150 300 300" aria-hidden="true" className={className}>
      <ArtHalo />
      <g fill="none" className="stroke-glimmer" strokeWidth="6" strokeLinecap="round">
        <path d="M-92-62v-26a12 12 0 0 1 12-12h26" />
        <path d="M92-62v-26a12 12 0 0 0-12-12h-26" />
        <path d="M-92 70v26a12 12 0 0 0 12 12h26" />
        <path d="M92 70v26a12 12 0 0 1-12 12h-26" />
      </g>
      <JarArt transform="translate(0 20) scale(.92)" />
      <FairyArt transform="translate(104 -112) rotate(12) scale(.72)" />
      <g transform="translate(68 -128) scale(.9)">
        <path d={SPARKLE_PATH} className="twinkle fill-glimmer-bright" />
      </g>
      <g transform="translate(0 128)">
        <rect x="-92" y="-18" width="184" height="36" rx="18" className="fill-paper" />
        <circle cx="-70" r="11" className="fill-moss" />
        <path
          d="M-75 0l3.5 3.5 6.5-7"
          fill="none"
          className="stroke-glimmer"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="-52" y="5" className="fill-ink font-sans text-[14px] font-bold">
          Glass jar · recyclable
        </text>
      </g>
    </svg>
  );
}
