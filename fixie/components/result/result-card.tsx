import type { Recyclable, ScanResult } from "@/lib/scan/schema";
import { Icon, type IconName } from "@/components/ui/icon";
import { Fairy, FAIRIES } from "./fairy";
import { IdeaCard } from "./idea-card";
import { SectionTitle } from "./section-title";

interface ResultCardProps {
  result: ScanResult;
  headingId: string;
  onClose: () => void;
}

const VERDICT: Record<
  Recyclable,
  { headline: string; detail: string; icon: IconName; badgeClass: string; eyebrow: string; stepsTitle: string }
> = {
  yes: {
    headline: "Yes, it's recyclable!",
    detail: "As long as it's sorted right",
    icon: "check",
    badgeClass: "bg-moss text-glimmer",
    eyebrow: "Return to the earth",
    stepsTitle: "Recycle it right",
  },
  no: {
    headline: "Not recyclable",
    detail: "Most places send this to landfill",
    icon: "close",
    badgeClass: "bg-bark text-lichen",
    eyebrow: "Where it goes",
    stepsTitle: "Throw it out right",
  },
  special_dropoff: {
    headline: "Needs a special drop-off",
    detail: "Keep it out of your home bins",
    icon: "alert",
    badgeClass: "bg-ember text-lichen",
    eyebrow: "Hazardous item",
    stepsTitle: "Drop it off safely",
  },
};

/** The fairy's report for one scan. Pure presentation: no fetching. */
export function ResultCard({ result, headingId, onClose }: ResultCardProps): React.JSX.Element {
  // SAFETY: anything short of a confident "ok" gets the retake prompt rather
  // than half an answer. The server enforces this too; this is belt and braces.
  if (result.status !== "ok" || result.confidence === "low" || !result.item) {
    return <UnsureCard result={result} headingId={headingId} onClose={onClose} />;
  }

  const verdict = result.recyclable ? VERDICT[result.recyclable] : null;
  const hasSteps = result.howToRecycle.length > 0;

  return (
    <article className="flex flex-col gap-6">
      <ResultHeading
        headingId={headingId}
        title={result.item}
        onClose={onClose}
      />

      <section className="relative overflow-hidden rounded-[26px] bg-linear-145 from-sage-mist to-cream pb-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--glimmer-bright)_55%,transparent),transparent_34%)]"
        />
        <p className="absolute top-3.5 right-3.5 rounded-full bg-paper/80 px-2.5 py-1.5 text-xs font-bold text-moss">
          {result.confidence === "high" ? "High" : "Medium"} confidence
        </p>
        <div className="relative flex flex-col items-center pt-8">
          <Fairy kind={result.fairy} size={136} />
          {result.fairy && (
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              {FAIRIES[result.fairy].name}, {FAIRIES[result.fairy].title}
              {result.material && <span className="font-normal"> · {result.material}</span>}
            </p>
          )}
        </div>
        {verdict && (
          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-paper/80 bg-paper/90 px-4 py-3 backdrop-blur-sm">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${verdict.badgeClass}`}>
              <Icon name={verdict.icon} size={19} />
            </span>
            <div>
              <p className="font-display text-base leading-tight font-semibold">{verdict.headline}</p>
              <p className="text-sm text-ink-soft">{verdict.detail}</p>
            </div>
          </div>
        )}
      </section>

      {result.caution && (
        <div role="note" className="flex gap-3 rounded-2xl border border-ember/40 bg-ember-soft p-4">
          <Icon name="alert" size={22} className="mt-0.5 text-ember" />
          <div>
            <p className="font-semibold text-ember">Handle with care</p>
            <p className="mt-1 text-[15px] leading-relaxed">{result.caution}</p>
          </div>
        </div>
      )}

      {hasSteps && (
        <section aria-labelledby={`${headingId}-steps`}>
          <div id={`${headingId}-steps`}>
            <SectionTitle
              number="01"
              eyebrow={verdict?.eyebrow ?? "What to do"}
              title={verdict?.stepsTitle ?? "What to do with it"}
              tone="light"
            />
          </div>
          <ol className="overflow-hidden rounded-[19px] border border-ink/10 bg-paper">
            {result.howToRecycle.map((step, index) => (
              <li key={step} className="flex items-center gap-3 border-b border-ink/10 px-4 py-3.5 last:border-b-0">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage font-display text-sm font-bold text-moss"
                >
                  {index + 1}
                </span>
                <span className="text-[15px] leading-snug font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.repurpose.length > 0 && <IdeaCard ideas={result.repurpose} number={hasSteps ? "02" : "01"} />}

      <p className="text-sm leading-relaxed text-ink-soft">
        Recycling rules vary by city. Check with your local hauler before you bin it.
      </p>

      <ScanAgainButton onClick={onClose} />
    </article>
  );
}

function UnsureCard({ result, headingId, onClose }: ResultCardProps): React.JSX.Element {
  const isNotAnItem = result.status === "not_an_item";
  return (
    <article className="flex flex-col gap-6">
      <ResultHeading
        headingId={headingId}
        title={isNotAnItem ? "Nothing to sort here" : "Hmm, not sure"}
        eyebrow="The grove is puzzled"
        onClose={onClose}
      />
      <section className="flex flex-col items-center rounded-[26px] bg-linear-145 from-sage-mist to-cream px-6 py-8 text-center">
        <div className="grayscale">
          <Fairy kind={null} size={112} />
        </div>
        <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">
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
    <div className="grid grid-cols-[44px_1fr] items-center gap-3">
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
          className="font-display text-[1.75rem] leading-[1.08] font-semibold tracking-tight outline-none"
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
    <button type="button" onClick={onClick} className={`min-h-13 w-full rounded-full px-6 text-base font-semibold ${style}`}>
      {label}
    </button>
  );
}
