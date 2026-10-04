"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ScanResult, UpcycleIdea } from "@/lib/scan/schema";
import { Icon } from "@/components/ui/icon";
import { StepList } from "./step-list";

interface IdeaCardProps {
  ideas: ScanResult["repurpose"];
}

const DIFFICULTY_LABEL: Record<UpcycleIdea["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
};

/**
 * One upcycling project at a time, with a button to flip to the next.
 * "Show me how" swaps the card to the supplies and steps in the same space
 * rather than growing it, because the result screen never scrolls.
 */
export function IdeaCard({ ideas }: IdeaCardProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const hasToggled = useRef(false);
  const position = index % ideas.length;
  const idea = ideas[position];

  // The toggle is a different button in each view, so carry keyboard focus
  // across the swap instead of dropping it on <body>. Skipped on first render.
  useEffect(() => {
    if (hasToggled.current) toggleRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  function toggle(): void {
    hasToggled.current = true;
    setIsOpen((open) => !open);
  }

  const toggleButton = (
    <button
      ref={toggleRef}
      type="button"
      aria-expanded={isOpen}
      aria-controls={detailsId}
      onClick={toggle}
      className={
        isOpen
          ? "inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold text-honey-light"
          : "inline-flex min-h-11 items-center gap-2 rounded-full border border-glimmer/50 px-4 text-sm font-bold text-honey-light"
      }
    >
      {isOpen && <Icon name="arrow" size={16} className="rotate-180" />}
      {isOpen ? "Back" : "Show me how"}
      {!isOpen && <Icon name="arrow" size={16} />}
    </button>
  );

  return (
    <section className="flex h-full max-h-full flex-col overflow-clip rounded-[22px] bg-moss-deep bg-[radial-gradient(circle_at_88%_20%,color-mix(in_srgb,var(--glimmer)_18%,transparent),transparent_22%)] px-4 py-[clamp(10px,2cqh,18px)] text-lichen">
      {isOpen ? (
        <div id={detailsId} className="flex min-h-0 flex-1 flex-col gap-[clamp(6px,1.4cqh,12px)]">
          <div className="flex shrink-0 items-center gap-3">
            {toggleButton}
            <h3 className="min-w-0 truncate font-display text-[clamp(16px,2.4cqh,18px)] font-semibold">{idea.title}</h3>
          </div>
          {/* SAFETY: the project's risk comes first so it can never be pushed out of view. */}
          {idea.safety && (
            <p
              role="note"
              className="flex shrink-0 gap-2 rounded-xl bg-ember-soft px-3 py-2 text-[clamp(12px,1.8cqh,14px)] leading-snug text-ink"
            >
              <Icon name="alert" size={16} className="mt-0.5 text-ember" />
              <span>
                <span className="font-semibold text-ember">Handle with care. </span>
                {idea.safety}
              </span>
            </p>
          )}
          {idea.supplies.length > 0 && (
            <p className="shrink-0 text-[clamp(12px,1.8cqh,14px)] leading-snug text-lichen/85">
              <span className="font-bold tracking-wide text-honey-light uppercase">Gather </span>
              {idea.supplies.join(" · ")}
            </p>
          )}
          <div className="min-h-0 flex-1">
            <StepList key={position} steps={idea.steps} tone="dark" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <IdeaGlow />
            <div aria-live="polite" className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-honey-light uppercase">
                <Icon name="wand" size={14} />
                Idea {position + 1} of {ideas.length}
              </p>
              <h3 className="mt-1 font-display text-[clamp(17px,2.6cqh,20px)] leading-tight font-semibold">
                {idea.title}
              </h3>
              <p className="mt-1 line-clamp-3 text-[clamp(13px,1.9cqh,14px)] leading-snug text-lichen/85">
                {idea.summary}
              </p>
              <ul aria-label="About this project" className="mt-2 flex flex-wrap gap-2">
                <Chip>{DIFFICULTY_LABEL[idea.difficulty]}</Chip>
                <Chip>About {idea.minutes} min</Chip>
              </ul>
            </div>
          </div>
          <div className="mt-[clamp(8px,2cqh,16px)] flex flex-wrap items-center justify-between gap-2">
            {toggleButton}
            {ideas.length > 1 && (
              <button
                type="button"
                onClick={() => setIndex((current) => (current + 1) % ideas.length)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-honey-light"
              >
                <span className="underline decoration-honey-light/50 underline-offset-4">Next idea</span>
                <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <li className="rounded-full bg-lichen/12 px-2.5 py-1 text-xs font-semibold text-lichen">{children}</li>;
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
