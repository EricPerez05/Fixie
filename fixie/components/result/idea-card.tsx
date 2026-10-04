"use client";

import { useState } from "react";
import type { ScanResult } from "@/lib/scan/schema";
import { Icon } from "@/components/ui/icon";

interface IdeaCardProps {
  ideas: ScanResult["repurpose"];
}

/** One reuse idea at a time, with a button to flip to the next. */
export function IdeaCard({ ideas }: IdeaCardProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const idea = ideas[index % ideas.length];

  return (
    <section className="flex h-full max-h-full flex-col justify-center overflow-clip rounded-[22px] bg-moss-deep bg-[radial-gradient(circle_at_88%_20%,color-mix(in_srgb,var(--glimmer)_18%,transparent),transparent_22%)] px-4 py-[clamp(10px,2cqh,18px)] text-lichen">
      <div className="grid grid-cols-[auto_1fr] items-center gap-4">
        <IdeaGlow />
        <div aria-live="polite" className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-honey-light uppercase">
            <Icon name="wand" size={14} />
            Idea {index + 1} of {ideas.length}
          </p>
          <h3 className="mt-1 font-display text-[clamp(17px,2.6cqh,20px)] leading-tight font-semibold">{idea.title}</h3>
          <p className="mt-1 text-[clamp(13px,1.9cqh,14px)] leading-snug text-lichen/85">{idea.steps}</p>
          {ideas.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % ideas.length)}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-honey-light"
            >
              <span className="underline decoration-honey-light/50 underline-offset-4">Next idea</span>
              <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** A jar of fireflies: the generic stand-in for an idea illustration. */
function IdeaGlow(): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[clamp(64px,13cqh,104px)] w-[clamp(52px,10cqh,80px)] shrink-0 items-end justify-center"
    >
      <span className="absolute top-0 left-1/2 h-[60%] w-[78%] -translate-x-1/2 rounded-t-full border-2 border-b-0 border-sage-shade/70" />
      <span className="relative z-10 grid h-[72%] w-full grid-cols-2 place-items-center rounded-[8px_8px_13px_13px] bg-fairy-metal p-[18%] shadow-[inset_0_0_24px_var(--glimmer),0_8px_18px_color-mix(in_srgb,var(--moss-night)_40%,transparent)]">
        {[0, 1, 2, 3].map((dot) => (
          <i key={dot} className="h-1.5 w-1.5 rounded-full bg-glimmer-bright shadow-[0_0_8px_var(--glimmer-bright)]" />
        ))}
      </span>
    </div>
  );
}
