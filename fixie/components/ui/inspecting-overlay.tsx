const FIREFLIES = [
  "top-[34%] left-[18%]",
  "top-[28%] right-[20%] [animation-delay:-0.8s]",
  "top-[52%] left-[38%] [animation-delay:-1.6s]",
  "top-[60%] right-[26%] [animation-delay:-0.4s]",
  "top-[22%] left-[44%] [animation-delay:-2.2s]",
  "top-[46%] right-[12%] [animation-delay:-1.1s]",
];

/**
 * Loading state over the frozen frame. A 3–10s vision call feels broken
 * without something visibly happening.
 */
export function InspectingOverlay(): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-10 bg-moss-night/55">
      {FIREFLIES.map((position) => (
        <span key={position} aria-hidden="true" className={`firefly ${position}`} />
      ))}
      <div className="absolute inset-x-0 bottom-[calc(10rem+var(--safe-bottom))] text-center">
        <p className="font-display text-2xl font-semibold text-lichen">The fairies are inspecting…</p>
        <p className="mt-1 text-sm text-lichen/80">This usually takes a few seconds</p>
      </div>
    </div>
  );
}
