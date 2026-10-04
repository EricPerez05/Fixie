"use client";

import { useId, useState } from "react";
import type { Recyclable, ScanResult } from "@/lib/scan/schema";
import { Icon, type IconName } from "@/components/ui/icon";
import { Fairy, FAIRIES } from "./fairy";
import { IdeaCard } from "./idea-card";
import { StepList } from "./step-list";

interface ResultCardProps {
  result: ScanResult;
  headingId: string;
  onClose: () => void;
}

const VERDICT: Record<
  Recyclable,
  { headline: string; detail: string; icon: IconName; badgeClass: string; stepsTitle: string }
> = {
  yes: {
    headline: "Yes, it's recyclable!",
    detail: "As long as it's sorted right",
    icon: "check",
    badgeClass: "bg-moss text-glimmer",
    stepsTitle: "Recycle it",
  },
  no: {
    headline: "Not recyclable",
    detail: "This one goes in the trash",
    icon: "close",
    badgeClass: "bg-bark text-lichen",
    stepsTitle: "Throw it out",
  },
  special_dropoff: {
    headline: "Needs a special drop-off",
    detail: "Keep it out of your home bins",
    icon: "alert",
    badgeClass: "bg-ember text-lichen",
    stepsTitle: "Drop it off",
  },
};

/*
 * The result fits one screen with no scrolling, down to a ~540px-tall phone.
 * Sizes use cqh (the panel's height, set as a size container in Panel), so
 * the same layout tightens on short screens and inside the desktop frame.
 */

/** The fairy's report for one scan. Pure presentation: no fetching. */
export function ResultCard({ result, headingId, onClose }: ResultCardProps): React.JSX.Element {
  // SAFETY: anything short of a confident "ok" gets the retake prompt rather
  // than half an answer. The server enforces this too; this is belt and braces.
  if (result.status !== "ok" || result.confidence === "low" || !result.item) {
    return <UnsureCard result={result} headingId={headingId} onClose={onClose} />;
  }
  return <ConfidentResult result={result} item={result.item} headingId={headingId} onClose={onClose} />;
}

function ConfidentResult({
  result,
  item,
  headingId,
  onClose,
}: ResultCardProps & { item: string }): React.JSX.Element {
  const tabsId = useId();
  const [tab, setTab] = useState<"steps" | "ideas">("steps");
  const verdict = result.recyclable ? VERDICT[result.recyclable] : null;
  const stepsTitle = verdict?.stepsTitle ?? "What to do";
  const hasSteps = result.howToRecycle.length > 0;
  const hasIdeas = result.repurpose.length > 0;
  // Two sections would overflow a small phone, so they share one slot as tabs.
  const hasTabs = hasSteps && hasIdeas;
  const shown = hasTabs ? tab : hasSteps ? "steps" : "ideas";

  return (
    <article className="flex h-full min-h-0 flex-col gap-[clamp(8px,1.8cqh,16px)]">
      <ResultHeading headingId={headingId} title={item} onClose={onClose} />

      <section className="relative flex shrink-0 items-center gap-3 overflow-hidden rounded-[22px] bg-linear-145 from-sage-mist to-cream p-[clamp(8px,1.6cqh,14px)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_30%_50%,color-mix(in_srgb,var(--glimmer-bright)_55%,transparent),transparent_60%)]"
        />
        <div className="relative h-[clamp(56px,11cqh,92px)] w-[clamp(56px,11cqh,92px)] shrink-0">
          <Fairy kind={result.fairy} size="100%" />
        </div>
        <div className="relative min-w-0">
          {verdict && (
            <p className="flex items-center gap-2 font-display text-[clamp(15px,2.3cqh,17px)] leading-tight font-semibold">
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${verdict.badgeClass}`}>
                <Icon name={verdict.icon} size={14} />
              </span>
              {verdict.headline}
            </p>
          )}
          {verdict && <p className="mt-0.5 text-[clamp(12px,1.8cqh,14px)] text-ink-soft">{verdict.detail}</p>}
          <p className="mt-1 text-xs text-ink-soft">
            {result.fairy && <span className="font-semibold">{FAIRIES[result.fairy].name} · </span>}
            {result.material}
            {result.material && " · "}
            {result.confidence === "high" ? "High" : "Medium"} confidence
          </p>
        </div>
      </section>

      {result.caution && (
        <div role="note" className="flex shrink-0 gap-2.5 rounded-2xl border border-ember/40 bg-ember-soft px-3.5 py-[clamp(8px,1.4cqh,12px)]">
          <Icon name="alert" size={20} className="mt-0.5 text-ember" />
          <p className="text-[clamp(13px,1.9cqh,15px)] leading-snug">
            <span className="font-semibold text-ember">Handle with care. </span>
            {result.caution}
          </p>
        </div>
      )}

      {hasTabs ? (
        <div role="tablist" aria-label="What to do with it" className="flex shrink-0 gap-1 rounded-full bg-sage p-1">
          <TabButton id={`${tabsId}-steps`} isSelected={tab === "steps"} onSelect={() => setTab("steps")}>
            {stepsTitle}
          </TabButton>
          <TabButton id={`${tabsId}-ideas`} isSelected={tab === "ideas"} onSelect={() => setTab("ideas")}>
            Reuse it
          </TabButton>
        </div>
      ) : (
        (hasSteps || hasIdeas) && (
          <h2 className="shrink-0 font-display text-[clamp(17px,2.6cqh,20px)] leading-tight font-semibold">
            {hasSteps ? stepsTitle : "Reuse it"}
          </h2>
        )
      )}

      <div
        className="min-h-0 flex-1 overflow-clip"
        {...(hasTabs && { role: "tabpanel", id: `${tabsId}-panel`, "aria-labelledby": `${tabsId}-${shown}` })}
      >
        {shown === "steps" ? <StepList steps={result.howToRecycle} /> : <IdeaCard ideas={result.repurpose} />}
      </div>

      <footer className="flex shrink-0 flex-col gap-2">
        <p className="text-center text-xs text-ink-soft">Rules vary by city. Check with your local hauler.</p>
        <ScanAgainButton onClick={onClose} />
      </footer>
    </article>
  );
}

function TabButton({
  id,
  isSelected,
  onSelect,
  children,
}: {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={isSelected}
      onClick={onSelect}
      className={`min-h-11 flex-1 rounded-full text-sm font-semibold transition-colors ${
        isSelected ? "bg-moss text-glimmer" : "text-moss"
      }`}
    >
      {children}
    </button>
  );
}

function UnsureCard({ result, headingId, onClose }: ResultCardProps): React.JSX.Element {
  const isNotAnItem = result.status === "not_an_item";
  return (
    <article className="flex h-full min-h-0 flex-col gap-[clamp(10px,2cqh,20px)]">
      <ResultHeading
        headingId={headingId}
        title={isNotAnItem ? "Nothing to sort here" : "Hmm, not sure"}
        eyebrow="The grove is puzzled"
        onClose={onClose}
      />
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[26px] bg-linear-145 from-sage-mist to-cream px-6 text-center">
        <div className="h-[clamp(72px,16cqh,112px)] w-[clamp(72px,16cqh,112px)] grayscale">
          <Fairy kind={null} size="100%" />
        </div>
        <p className="mt-4 max-w-[30ch] text-[clamp(14px,2cqh,15px)] leading-relaxed text-ink-soft">
          {isNotAnItem
            ? "The fairies don't see an object. Point the camera at one thing you want to recycle or reuse."
            : "The fairies couldn't make that out. Try a closer, brighter shot with just one item in the frame. When in doubt, keep it out of the recycling."}
        </p>
      </section>
      <ScanAgainButton onClick={onClose} />
    </article>
  );
}

export function ResultHeading({
  headingId,
  title,
  onClose,
  eyebrow = "The grove has spoken",
}: {
  headingId: string;
  title: string;
  onClose: () => void;
  eyebrow?: string;
}): React.JSX.Element {
  return (
    <div className="grid shrink-0 grid-cols-[44px_1fr] items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close and scan again"
        className="grid h-11 w-11 place-items-center rounded-full border border-moss/15 bg-paper"
      >
        <Icon name="close" size={20} />
      </button>
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-wider text-honey uppercase">{eyebrow}</p>
        <h1
          id={headingId}
          tabIndex={-1}
          className="line-clamp-2 font-display text-[clamp(1.35rem,4cqh,1.75rem)] leading-[1.08] font-semibold tracking-tight outline-none"
        >
          {title}
        </h1>
      </div>
    </div>
  );
}

export function ScanAgainButton({
  onClick,
  label = "Scan another item",
  variant = "solid",
}: {
  onClick: () => void;
  label?: string;
  variant?: "solid" | "outline";
}): React.JSX.Element {
  const style =
    variant === "solid" ? "bg-moss text-glimmer active:bg-moss-deep" : "border-2 border-moss text-moss";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 w-full shrink-0 rounded-full px-6 text-base font-semibold ${style}`}
    >
      {label}
    </button>
  );
}
