"use client";

import { useState } from "react";
import type { ScanResult } from "@/lib/scan/schema";
import { Icon } from "@/components/ui/icon";
import { SectionTitle } from "./section-title";

interface IdeaCardProps {
  ideas: ScanResult["repurpose"];
  number: string;
}

/** One reuse idea at a time, with a button to flip to the next. */
export function IdeaCard({ ideas, number }: IdeaCardProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const idea = ideas[index % ideas.length];

  return (
    <section className="rounded-3xl bg-moss-deep bg-[radial-gradient(circle_at_88%_20%,color-mix(in_srgb,var(--glimmer)_18%,transparent),transparent_22%)] p-5 text-lichen shadow-[0_12px_25px_color-mix(in_srgb,var(--moss-deep)_18%,transparent)]">
      <SectionTitle
        number={number}
        eyebrow="A sprinkle of fairy magic"
        title="Make it magical"
        tone="dark"
        icon="wand"
      />
      <div className="grid grid-cols-[88px_1fr] items-center gap-4">
        <IdeaGlow />
        <div aria-live="polite">
          <p className="text-xs font-bold tracking-wide text-honey-light uppercase">
            Idea {index + 1} of {ideas.length}
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight font-semibold">{idea.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-lichen/85">{idea.summary}</p>
        </div>
      </div>
      {ideas.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % ideas.length)}
          className="mt-3 ml-[104px] inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-honey-light"
        >
          <span className="underline decoration-honey-light/50 underline-offset-4">Next idea</span>
          <Icon name="arrow" size={16} />
        </button>
      )}
    </section>
  );
}

/** A jar of fireflies: the generic stand-in for an idea illustration. */
function IdeaGlow(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="relative grid h-28 place-items-end justify-center">
      <span className="absolute top-0 left-1/2 h-16 w-14 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-sage-shade/70" />
      <span className="relative z-10 grid h-20 w-18 grid-cols-2 place-items-center rounded-[8px_8px_13px_13px] bg-fairy-metal p-4 shadow-[inset_0_0_28px_var(--glimmer),0_8px_18px_color-mix(in_srgb,var(--moss-night)_40%,transparent)]">
        {[0, 1, 2, 3].map((dot) => (
          <i key={dot} className="h-1.5 w-1.5 rounded-full bg-glimmer-bright shadow-[0_0_8px_var(--glimmer-bright)]" />
        ))}
      </span>
    </div>
  );
}
