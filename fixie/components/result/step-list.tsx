"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

// Room kept for the "More steps" row when the steps don't all fit.
const PAGER_PX = 52;

const TONES = {
  light: {
    list: "rounded-[18px] border border-ink/10 bg-paper",
    item: "border-b border-ink/10 px-3.5 last:border-b-0",
    number: "bg-sage text-moss",
    text: "font-medium",
    counter: "text-ink-soft",
    pager: "bg-sage text-moss",
  },
  dark: {
    list: "",
    item: "px-0.5",
    number: "bg-glimmer text-moss-deep",
    text: "",
    counter: "text-lichen/80",
    pager: "border border-glimmer/50 text-honey-light",
  },
} as const;

interface StepListProps {
  steps: string[];
  /** "light" on cream (recycling steps), "dark" inside the green idea card. */
  tone?: keyof typeof TONES;
}

/**
 * Numbered steps that never scroll. When they don't all fit (a short phone,
 * long steps, a caution taking space), it shows as many as fit and pages to
 * the rest. SAFETY: steps are never silently cut off; a hazardous item's
 * drop-off steps must always be reachable.
 */
export function StepList({ steps, tone = "light" }: StepListProps): React.JSX.Element {
  const areaRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(0);
  const [fit, setFit] = useState<{ count: number; height: number | null }>({ count: steps.length, height: null });
  const style = TONES[tone];

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    // Fires once on observe, then whenever the space changes (rotation,
    // window resize), so the page size always matches the screen.
    const observer = new ResizeObserver(() => {
      const top = area.getBoundingClientRect().top;
      const bottoms = [...area.querySelectorAll("li")].map((item) => item.getBoundingClientRect().bottom - top);
      if ((bottoms.at(-1) ?? 0) <= area.clientHeight) {
        setFit({ count: bottoms.length, height: null });
        return;
      }
      const count = Math.max(1, bottoms.filter((bottom) => bottom <= area.clientHeight - PAGER_PX).length);
      // +1 keeps the list's bottom border inside the clip.
      setFit({ count, height: bottoms[count - 1] + 1 });
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [start, steps]);

  const shown = steps.slice(start);
  const end = Math.min(start + fit.count, steps.length);
  const hasMore = end < steps.length;

  return (
    <div ref={areaRef} className="relative h-full min-h-0">
      <ol style={fit.height === null ? undefined : { maxHeight: fit.height }} className={`overflow-clip ${style.list}`}>
        {shown.map((step, offset) => (
          <li
            key={start + offset}
            aria-hidden={offset >= fit.count || undefined}
            className={`flex items-center gap-3 py-[clamp(5px,1.2cqh,11px)] ${style.item}`}
          >
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-display text-xs font-bold ${style.number}`}
            >
              {start + offset + 1}
            </span>
            <span className={`text-[clamp(13px,2cqh,15px)] leading-snug ${style.text}`}>{step}</span>
          </li>
        ))}
      </ol>
      {(hasMore || start > 0) && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3">
          <p className={`text-xs ${style.counter}`}>
            Steps {start + 1}–{end} of {steps.length}
          </p>
          <button
            type="button"
            onClick={() => setStart(hasMore ? end : 0)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${style.pager}`}
          >
            {hasMore ? "More steps" : "Back to step 1"}
            <Icon name="arrow" size={16} className={hasMore ? "" : "rotate-180"} />
          </button>
        </div>
      )}
    </div>
  );
}
