import type { Recyclable, ScanResult } from "@/lib/scan/schema";
import { Fairy, FAIRIES } from "./fairy";

interface ResultCardProps {
  result: ScanResult;
  headingId: string;
  onScanAgain: () => void;
}

const VERDICT: Record<Recyclable, { label: string; className: string }> = {
  yes: { label: "Recyclable", className: "bg-moss text-lichen" },
  no: { label: "Not recyclable", className: "bg-bark text-lichen" },
  special_dropoff: { label: "Special drop-off only", className: "bg-ember text-lichen" },
};

/** The fairy's report for one scan. Pure presentation: no fetching, no state. */
export function ResultCard({ result, headingId, onScanAgain }: ResultCardProps): React.JSX.Element {
  // SAFETY: anything short of a confident "ok" gets the retake prompt rather
  // than half an answer. The server enforces this too; this is belt and braces.
  if (result.status !== "ok" || result.confidence === "low" || !result.item) {
    return <UnsureCard result={result} headingId={headingId} onScanAgain={onScanAgain} />;
  }

  const fairy = result.fairy ? FAIRIES[result.fairy] : null;
  const verdict = result.recyclable ? VERDICT[result.recyclable] : null;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className={`grid shrink-0 place-items-center rounded-full p-1 ${fairy?.badgeClass ?? "bg-fairy-mixed"}`}>
          <Fairy kind={result.fairy} size={76} />
        </div>
        <div className="min-w-0">
          {fairy && (
            <p className="text-sm text-ink-soft">
              {fairy.name}, {fairy.title}, found
            </p>
          )}
          <h2 id={headingId} tabIndex={-1} className="font-display text-[1.75rem] leading-tight font-bold outline-none">
            {result.item}
          </h2>
          {result.material && <p className="text-base text-ink-soft">{result.material}</p>}
        </div>
      </header>

      {verdict && (
        <p className={`self-start rounded-full px-4 py-1.5 text-base font-semibold ${verdict.className}`}>
          {verdict.label}
        </p>
      )}

      {result.caution && (
        <div role="note" className="rounded-2xl border-2 border-ember bg-ember-soft p-4">
          <p className="font-semibold text-ember">Handle with care</p>
          <p className="mt-1 leading-relaxed">{result.caution}</p>
        </div>
      )}

      {result.howToRecycle.length > 0 && (
        <section aria-labelledby={`${headingId}-steps`}>
          <h3 id={`${headingId}-steps`} className="font-display text-lg">
            How to get rid of it
          </h3>
          <ol className="mt-2 flex flex-col gap-2">
            {result.howToRecycle.map((step, index) => (
              <li key={step} className="flex gap-3 leading-relaxed">
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss text-sm font-semibold text-lichen"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.repurpose.length > 0 && (
        <section aria-labelledby={`${headingId}-ideas`}>
          <h3 id={`${headingId}-ideas`} className="font-display text-lg">
            Give it a second life
          </h3>
          <ul className="mt-2 flex flex-col gap-3">
            {result.repurpose.map((idea) => (
              <li key={idea.title} className="rounded-2xl border-2 border-fern/50 bg-glimmer-soft/40 p-4">
                <p className="font-semibold">{idea.title}</p>
                <p className="mt-1 leading-relaxed text-ink-soft">{idea.steps}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm leading-relaxed text-ink-soft">
        Recycling rules vary by city. Check with your local hauler before you bin it.
      </p>

      <ScanAgainButton onClick={onScanAgain} />
    </article>
  );
}

function UnsureCard({ result, headingId, onScanAgain }: ResultCardProps): React.JSX.Element {
  const isNotAnItem = result.status === "not_an_item";
  return (
    <article className="flex flex-col items-start gap-4">
      <div className="grid place-items-center rounded-full bg-fairy-mixed p-1 grayscale">
        <Fairy kind={null} size={64} />
      </div>
      <h2 id={headingId} tabIndex={-1} className="font-display text-2xl leading-tight font-bold outline-none">
        {isNotAnItem ? "The fairies don't see anything to sort" : "The fairies couldn't make that out"}
      </h2>
      <p className="leading-relaxed text-ink-soft">
        {isNotAnItem
          ? "Point the camera at one object you want to recycle or reuse."
          : "Try a closer, brighter shot with just one item in the frame. When in doubt, don't put it in the recycling."}
      </p>
      <ScanAgainButton onClick={onScanAgain} />
    </article>
  );
}

export function ScanAgainButton({
  onClick,
  label = "Scan again",
}: {
  onClick: () => void;
  label?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 w-full rounded-full bg-moss px-6 text-base font-semibold text-lichen active:bg-moss-deep"
    >
      {label}
    </button>
  );
}
