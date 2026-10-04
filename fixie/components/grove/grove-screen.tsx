"use client";

import { useEffect, useRef, useState } from "react";
import { markSeen, readSeenCount } from "@/hooks/use-grove";
import { countRecyclable, type GroveEntry } from "@/lib/grove/entries";
import type { GroveStatus } from "@/lib/grove/store";
import { layoutGrove, type GroveLayout } from "@/lib/grove/layout";
import { Icon } from "@/components/ui/icon";
import { formatDate, GroveTree } from "./grove-tree";

interface GroveScreenProps {
  /** Oldest first. */
  entries: readonly GroveEntry[];
  onOpenEntry: (entry: GroveEntry) => void;
  onScan: () => void;
  /** Only passed in development: buttons to plant or clear branches without scanning. */
  devTools?: { addSamples: (count: number) => void; clear: () => void };
  status: GroveStatus;
  /** True when the Grove syncs to the server, not just this phone. */
  isRemote: boolean;
  onRetry: () => void;
}

interface Measured {
  width: number;
  viewHeight: number;
  headerHeight: number;
  footerHeight: number;
}

/**
 * The Grove: a tree that grows one branch per scan the user logs.
 *
 * This is the one screen that scrolls (the app is otherwise one fixed screen):
 * the tree gets taller with every scan, so it has to. Only the tree moves; the
 * header and bottom nav stay put. It opens at the crown, on the newest branch.
 */
export function GroveScreen({
  entries,
  onOpenEntry,
  onScan,
  devTools,
  status,
  isRemote,
  onRetry,
}: GroveScreenProps): React.JSX.Element {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  // Branches added since the last visit play the grow animation once.
  const [growFrom] = useState(readSeenCount);
  const previousCount = useRef(entries.length);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const header = headerRef.current;
    const footer = footerRef.current;
    if (!scroller || !header || !footer) return;
    // The tree is laid out in px from these, so re-measure on any resize
    // (rotation, desktop frame, safe-area changes).
    const observer = new ResizeObserver(() =>
      setMeasured({
        width: scroller.clientWidth,
        viewHeight: scroller.clientHeight,
        headerHeight: header.offsetHeight,
        footerHeight: footer.offsetHeight,
      }),
    );
    [scroller, header, footer].forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    markSeen(entries.length);
    // A branch planted while watching grows at the top, so bring the top into view.
    if (entries.length > previousCount.current) scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    previousCount.current = entries.length;
  }, [entries.length]);

  const layout: GroveLayout | null = measured
    ? layoutGrove({
        count: entries.length,
        width: measured.width,
        minHeight: measured.viewHeight - measured.footerHeight,
        topInset: measured.headerHeight,
      })
    : null;

  const first = entries[0];
  const recyclable = countRecyclable(entries);

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        onScroll={(event) => setIsScrolledDown(event.currentTarget.scrollTop > 420)}
        className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-grove-sky [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* One long, quiet gradient: darkest at the crown, lifting toward the ground. */}
        <div className="bg-linear-to-b from-grove-sky via-moss-night via-35% to-moss-deep">
          {layout && (
            <GroveTree
              layout={layout}
              entries={entries}
              growFrom={growFrom}
              onOpenEntry={onOpenEntry}
              onScan={onScan}
            />
          )}
          <footer ref={footerRef} className="px-6 pt-2 pb-[calc(5.5rem+var(--safe-bottom))] text-center">
            <p className="text-[11px] font-bold tracking-[0.08em] text-honey-light uppercase">
              {first ? `Planted ${formatDate(first.scannedAt, true)}` : "A seed, waiting"}
            </p>
            <p className="mt-0.5 font-display text-sm font-semibold text-lichen/80">
              {first ? `First scan: ${first.result.item}` : "Every scan you log grows a branch"}
            </p>
            <p className="mt-3 text-xs text-lichen/55">
              {isRemote ? "Saved privately to your Grove" : "Saved on this phone only"}
            </p>
          </footer>
        </div>
      </div>

      <header
        ref={headerRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-grove-sky from-70% to-transparent px-5 pt-[calc(var(--safe-top)+1rem)] pb-8 text-center"
      >
        <h2 className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-lichen">Grove</h2>
        <p className="mt-0.5 text-[13px] text-lichen/75">
          {entries.length > 0 ? (
            <>
              <b className="font-bold text-honey-light tabular-nums">{entries.length}</b>{" "}
              {entries.length === 1 ? "branch" : "branches"} ·{" "}
              <b className="font-bold text-honey-light tabular-nums">{recyclable}</b> recyclable
            </>
          ) : status === "loading" ? (
            "Gathering your Grove…"
          ) : (
            "Scans you log grow here"
          )}
        </p>
        {status === "error" && (
          <p role="status" className="pointer-events-auto mx-auto mt-2 flex max-w-xs items-center justify-center gap-2 text-xs text-lichen/80">
            {entries.length > 0 ? "Couldn't sync. Showing what this phone remembers." : "Couldn't reach your Grove."}
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 rounded-full px-2 font-bold text-honey-light underline underline-offset-4"
            >
              Try again
            </button>
          </p>
        )}
      </header>

      {isScrolledDown && (
        <button
          type="button"
          onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ top: measured ? measured.headerHeight - 20 : undefined }}
          className="absolute left-1/2 z-10 flex min-h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-lichen/15 bg-moss-night/90 px-3.5 text-xs font-bold text-lichen backdrop-blur-md"
        >
          <Icon name="arrow" size={14} className="-rotate-90" />
          Newest branch
        </button>
      )}

      {/* Checked here too, not just by the caller, so the bundler drops this block from production builds. */}
      {process.env.NODE_ENV === "development" && devTools && (
        <div className="absolute inset-x-0 bottom-[calc(5.5rem+var(--safe-bottom))] z-10 flex justify-center">
          <div className="flex items-center gap-1 rounded-full border border-dashed border-honey-light/50 bg-moss-night/90 px-2 py-1 text-xs font-bold text-honey-light">
            <span className="px-1 text-[10px] tracking-widest uppercase">Dev</span>
            <DevButton onClick={() => devTools.addSamples(1)}>+1 branch</DevButton>
            <DevButton onClick={() => devTools.addSamples(10)}>+10</DevButton>
            <DevButton onClick={devTools.clear}>Clear</DevButton>
          </div>
        </div>
      )}
    </div>
  );
}

function DevButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className="min-h-9 rounded-full px-3 hover:bg-lichen/10">
      {children}
    </button>
  );
}
