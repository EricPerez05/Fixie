"use client";

import { useId, useState } from "react";
import type { ScanResult, UpcycleIdea } from "@/lib/scan/schema";
import { Icon } from "@/components/ui/icon";
import { SectionTitle } from "./section-title";

interface IdeaCardProps {
  ideas: ScanResult["repurpose"];
  number: string;
}

const DIFFICULTY_LABEL: Record<UpcycleIdea["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
};

/**
 * One upcycling project at a time, with a button to flip to the next.
 * "Show me how" opens the supplies checklist and the steps, so the card
 * stays short until someone actually wants to make it.
 */
export function IdeaCard({ ideas, number }: IdeaCardProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const position = index % ideas.length;
  const idea = ideas[position];

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
            Idea {position + 1} of {ideas.length}
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight font-semibold">{idea.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-lichen/85">{idea.summary}</p>
          <ul aria-label="About this project" className="mt-2.5 flex flex-wrap gap-2">
            <Chip>{DIFFICULTY_LABEL[idea.difficulty]}</Chip>
            <Chip>About {idea.minutes} min</Chip>
          </ul>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailsId}
        onClick={() => setIsOpen((open) => !open)}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-glimmer/50 px-5 text-sm font-bold text-honey-light"
      >
        {isOpen ? "Hide the steps" : "Show me how"}
        <Icon name="arrow" size={16} className={isOpen ? "-rotate-90" : "rotate-90"} />
      </button>

      {/* Keyed by idea so the checklist starts fresh for each project. */}
      <div id={detailsId} hidden={!isOpen}>
        {isOpen && <IdeaDetails key={position} idea={idea} />}
      </div>

      {ideas.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((current) => (current + 1) % ideas.length)}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-honey-light"
        >
          <span className="underline decoration-honey-light/50 underline-offset-4">Next idea</span>
          <Icon name="arrow" size={16} />
        </button>
      )}
    </section>
  );
}

function IdeaDetails({ idea }: { idea: UpcycleIdea }): React.JSX.Element {
  const suppliesId = useId();
  const stepsId = useId();

  return (
    <div className="mt-4 flex flex-col gap-4">
      {idea.supplies.length > 0 && (
        <section aria-labelledby={suppliesId}>
          <h4 id={suppliesId} className="text-xs font-bold tracking-wider text-honey-light uppercase">
            Gather from home
          </h4>
          <ul className="mt-1.5">
            {idea.supplies.map((supply) => (
              <li key={supply}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-glimmer" />
                  <span>{supply}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby={stepsId}>
        <h4 id={stepsId} className="text-xs font-bold tracking-wider text-honey-light uppercase">
          Make it
        </h4>
        <ol className="mt-2 flex flex-col gap-2.5">
          {idea.steps.map((step, stepIndex) => (
            <li key={step} className="flex gap-3 text-[15px] leading-snug">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-glimmer font-display text-sm font-bold text-moss-deep"
              >
                {stepIndex + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {idea.safety && (
        <div role="note" className="flex gap-3 rounded-2xl border border-ember/40 bg-ember-soft p-4 text-ink">
          <Icon name="alert" size={22} className="mt-0.5 text-ember" />
          <div>
            <p className="font-semibold text-ember">Handle with care</p>
            <p className="mt-1 text-[15px] leading-relaxed">{idea.safety}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <li className="rounded-full bg-lichen/12 px-2.5 py-1 text-xs font-semibold text-lichen">{children}</li>
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
