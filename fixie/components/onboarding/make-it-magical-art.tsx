import { ArtHalo, FireflyArt, JarArt } from "./art-parts";

/** Intro screen 3: the jar turned into a firefly lantern, with project ideas floating around it. */
export function MakeItMagicalArt({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="-150 -150 300 300" aria-hidden="true" className={className}>
      <ArtHalo />
      <circle cy="22" r="64" className="twinkle fill-glimmer-bright" opacity=".16" />
      <JarArt transform="translate(0 20) scale(.92)" />
      {/* Twine around the neck and a handle, so the jar reads as a lantern. */}
      <g fill="none" className="stroke-honey-light">
        <path d="M-23-34h46" strokeWidth="5" strokeLinecap="round" />
        <path d="M-23-26h46" strokeWidth="5" strokeLinecap="round" />
        <path d="M-26-36C-40-80 40-80 26-36" strokeWidth="4" />
      </g>
      <FireflyArt transform="translate(4 30) scale(2.2)" />
      <FireflyArt transform="translate(-20 2) scale(.9)" />
      <FireflyArt transform="translate(22 60) scale(.8)" />
      <g className="font-sans text-[13px] font-bold" textAnchor="middle">
        <g transform="translate(-74 -104) rotate(-6)">
          <rect x="-58" y="-16" width="116" height="32" rx="16" className="fill-paper" />
          <text y="5" className="fill-ink">
            Fairy lantern
          </text>
        </g>
        <g transform="translate(78 -82) rotate(5)">
          <rect x="-56" y="-16" width="112" height="32" rx="16" className="fill-glimmer" />
          <text y="5" className="fill-moss-deep">
            Herb planter
          </text>
        </g>
        <g transform="translate(0 128)">
          <rect x="-74" y="-16" width="148" height="32" rx="16" className="fill-lichen/14" />
          <text y="5" className="fill-lichen">
            Easy · 20 min · indoors
          </text>
        </g>
      </g>
    </svg>
  );
}
