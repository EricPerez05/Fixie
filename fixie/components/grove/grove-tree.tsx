import type { GroveEntry } from "@/lib/grove/entries";
import type { Blob, GroveLayout, LeafTone } from "@/lib/grove/layout";
import type { Fairy, Recyclable } from "@/lib/scan/schema";
import { Icon } from "@/components/ui/icon";

interface GroveTreeProps {
  layout: GroveLayout;
  /** Oldest first, one per branch in layout.branches. */
  entries: readonly GroveEntry[];
  /** Branches at or after this index play the grow animation. */
  growFrom: number;
  onOpenEntry: (entry: GroveEntry) => void;
  onScan: () => void;
}

// Static class names so Tailwind can see them.
const TONE: Record<LeafTone, string> = {
  moss: "fill-moss",
  leaf: "fill-leaf",
  fern: "fill-fern",
  bright: "fill-leaf-bright",
};

const FRUIT: Record<Fairy, string> = {
  glass: "fill-fairy-glass",
  paper: "fill-fairy-paper",
  metal: "fill-fairy-metal",
  plastic: "fill-fairy-plastic",
  textile: "fill-fairy-textile",
  organic: "fill-fairy-organic",
  electronic: "fill-fairy-electronic",
  mixed: "fill-fairy-mixed",
};

const VERDICT: Record<Recyclable, string> = {
  yes: "Recycle",
  special_dropoff: "Drop-off",
  no: "Trash",
};

const LEAF = "M0 0 C4 -4.5 10 -4.5 14 0 C10 4.5 4 4.5 0 0 Z";
const PETAL = "M0 0 C-5.6 -3 -5 -9.6 0 -10.2 C5 -9.6 5.6 -3 0 0 Z";
const BLOSSOMS = [
  { dx: -20, dy: -30, r: 7, isPale: true },
  { dx: 22, dy: -14, r: 6, isPale: false },
  { dx: 4, dy: -44, r: 5, isPale: false },
  { dx: -26, dy: 2, r: 5, isPale: true },
] as const;

// Label width; the label is centred under its leaf cluster but kept on screen.
const LABEL_WIDTH = 148;
// Where the label sits relative to the cluster centre: the button's top edge,
// and the empty space above the text that covers the cluster.
const LABEL_TOP = -40;
const CLUSTER_SPACE = 74;

const LABEL_SHADOW = "[text-shadow:0_1px_3px_var(--grove-sky),0_0_8px_var(--grove-sky)]";

/** "Oct 4", or "October 4, 2026" with the year. */
export function formatDate(iso: string, withYear = false): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: withYear ? "long" : "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  });
}

function labelLeft(x: number, width: number): number {
  return Math.max(4, Math.min(width - LABEL_WIDTH - 4, x - LABEL_WIDTH / 2));
}

function Canopy({ blobs }: { blobs: Blob[] }): React.JSX.Element {
  const top = blobs[3];
  return (
    <>
      {blobs.map((blob, i) => (
        <circle key={i} cx={blob.cx} cy={blob.cy} r={blob.r} className={TONE[blob.tone]} />
      ))}
      {/* Soft light on top of the cluster. */}
      <circle cx={top.cx + 5} cy={top.cy + 3} r={top.r * 0.7} className="fill-sage" opacity={0.12} />
    </>
  );
}

/**
 * Draws the tree (decorative SVG) and lays a real button over each branch's
 * leaves and label, so every branch is tappable and reachable by keyboard and
 * screen reader. Buttons are listed newest first, matching the visual order.
 */
export function GroveTree({ layout, entries, growFrom, onOpenEntry, onScan }: GroveTreeProps): React.JSX.Element {
  const { width, height, centerX, groundY, crown, branches, bud } = layout;

  return (
    <div className="relative" style={{ height }}>
      {layout.fireflies.map((firefly, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`firefly ${i % 3 === 0 ? "firefly-side" : ""}`}
          style={{
            left: `${firefly.x}%`,
            top: firefly.y,
            width: firefly.size,
            height: firefly.size,
            opacity: firefly.opacity,
            animationDuration: `${firefly.seconds}s`,
            animationDelay: `${firefly.delay}s`,
          }}
        />
      ))}

      <svg
        aria-hidden="true"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 block"
      >
        {/* Only one Grove is ever on screen, so fixed ids can't collide. */}
        <defs>
          <linearGradient id="grove-bark" x1="0" x2="1">
            <stop offset="0" style={{ stopColor: "var(--bark-dark)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--bark)" }} />
            <stop offset="1" style={{ stopColor: "var(--bark-light)" }} />
          </linearGradient>
          <radialGradient id="grove-halo">
            <stop offset="0" style={{ stopColor: "var(--lichen)" }} stopOpacity={0.07} />
            <stop offset="1" style={{ stopColor: "var(--lichen)" }} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="grove-crown-glow">
            <stop offset="0" style={{ stopColor: "var(--glimmer-bright)" }} stopOpacity={0.16} />
            <stop offset="1" style={{ stopColor: "var(--glimmer-bright)" }} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="grove-ground" cx="0.5" cy="0.35" r="0.6">
            <stop offset="0" style={{ stopColor: "var(--moss)" }} />
            <stop offset="1" style={{ stopColor: "var(--moss-night)" }} stopOpacity={0} />
          </radialGradient>
          <filter id="grove-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* A faint glow behind the whole tree, so it reads as the one subject. */}
        <ellipse
          cx={centerX}
          cy={(crown.y + groundY) / 2}
          rx={width * 0.62}
          ry={(groundY - crown.y) / 2 + 160}
          fill="url(#grove-halo)"
        />
        <circle cx={crown.x} cy={crown.y - 10} r={130} fill="url(#grove-crown-glow)" />

        <ellipse cx={centerX} cy={groundY + 40} rx={width * 0.62} ry={70} fill="url(#grove-ground)" />
        <ellipse cx={centerX} cy={groundY + 22} rx={width * 0.36} ry={18} className="fill-moss-night" opacity={0.55} />
        {layout.roots.map((d, i) => (
          <path key={i} d={d} fill="url(#grove-bark)" />
        ))}
        <g className="stroke-fern" fill="none" strokeWidth={1.6} strokeLinecap="round" opacity={0.8}>
          {layout.grass.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Branches go under the trunk so their joins are hidden. */}
        {branches.map((branch, i) => {
          const entry = entries[i];
          if (!entry?.result.fairy) return null;
          const isNew = i >= growFrom;
          return (
            <g
              key={entry.id}
              className={isNew ? "grove-grow" : undefined}
              style={{ transformOrigin: `${branch.joint.x}px ${branch.joint.y}px` }}
            >
              <path d={branch.path} fill="url(#grove-bark)" />
              <path d={branch.twigPath} fill="url(#grove-bark)" />
              {branch.leaves.map((leaf, j) => (
                <path
                  key={j}
                  d={LEAF}
                  className={j === 0 ? "fill-fern" : "fill-leaf"}
                  transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
                />
              ))}
              <Canopy blobs={branch.canopy} />
              {/* The fairy's glowing fruit, in the colour of the item's material. */}
              <g className={isNew ? "grove-pop" : undefined}>
                <circle
                  cx={branch.tip.x}
                  cy={branch.tip.y + 13}
                  r={12}
                  className={FRUIT[entry.result.fairy]}
                  opacity={0.55}
                  filter="url(#grove-glow)"
                />
                <circle
                  cx={branch.tip.x}
                  cy={branch.tip.y + 13}
                  r={7.5}
                  className={`${FRUIT[entry.result.fairy]} stroke-ink`}
                  strokeWidth={1.5}
                />
              </g>
            </g>
          );
        })}

        <path
          d={bud.path}
          fill="none"
          className="stroke-lichen"
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeDasharray="3 6"
          strokeLinecap="round"
        />

        <path d={layout.trunkPath} fill="url(#grove-bark)" />
        <path d={layout.rimPath} fill="none" className="stroke-honey-light" strokeOpacity={0.28} strokeWidth={1.5} />
        <g className="stroke-bark-dark" fill="none" strokeWidth={1.4} strokeLinecap="round" opacity={0.7}>
          {layout.barkLines.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        <Canopy blobs={layout.crownCanopy} />
        {BLOSSOMS.map(({ dx, dy, r, isPale }, i) => (
          <g key={i} transform={`translate(${crown.x + dx} ${crown.y + dy}) scale(${r / 10})`}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <path
                key={angle}
                d={PETAL}
                transform={`rotate(${angle})`}
                className={isPale ? "fill-blossom-light" : "fill-blossom"}
              />
            ))}
            <circle r={2.2} className="fill-glimmer" />
          </g>
        ))}
      </svg>

      <ol aria-label="Your scans, newest first">
        {entries
          .map((entry, i) => ({ entry, branch: branches[i], isNew: i >= growFrom }))
          .reverse()
          .map(({ entry, branch, isNew }) => {
            if (!branch) return null;
            const verdict = entry.result.recyclable ? VERDICT[entry.result.recyclable] : null;
            const date = formatDate(entry.scannedAt);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onOpenEntry(entry)}
                  aria-label={`${entry.result.item}${verdict ? `, ${verdict}` : ""}, scanned ${date}. Open result`}
                  style={{ left: labelLeft(branch.tip.x, width), top: branch.tip.y + LABEL_TOP, width: LABEL_WIDTH }}
                  className={`group absolute flex flex-col items-center rounded-3xl pb-1 text-center ${isNew ? "grove-pop" : ""}`}
                >
                  <span
                    style={{ height: CLUSTER_SPACE, width: CLUSTER_SPACE }}
                    className="rounded-full transition-colors group-hover:bg-lichen/8"
                  />
                  <span
                    className={`line-clamp-2 font-display text-sm leading-tight font-semibold text-lichen ${LABEL_SHADOW}`}
                  >
                    {entry.result.item}
                  </span>
                  <span className={`mt-0.5 text-[10.5px] font-bold tracking-wide text-honey-light uppercase ${LABEL_SHADOW}`}>
                    {verdict ? `${date} · ${verdict}` : date}
                  </span>
                </button>
              </li>
            );
          })}
      </ol>

      <button
        type="button"
        onClick={onScan}
        aria-label={entries.length > 0 ? "Scan an item to grow your next branch" : "Scan your first item"}
        style={{ left: labelLeft(bud.tip.x, width), top: bud.tip.y - 22, width: LABEL_WIDTH }}
        className="group absolute flex flex-col items-center gap-2 rounded-3xl pb-1 text-center"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-dashed border-glimmer/60 bg-lichen/5 text-glimmer transition-colors group-hover:border-glimmer">
          <Icon name="plus" size={16} />
        </span>
        <span className="text-[11px] leading-snug font-bold text-lichen/70">
          {entries.length > 0 ? "Your next scan" : "Scan your first item"}
          <br />
          grows a branch here
        </span>
      </button>
    </div>
  );
}
