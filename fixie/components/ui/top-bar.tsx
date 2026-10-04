import { Icon } from "./icon";

interface TopBarProps {
  /** "dark" over the forest-green scan screens, "light" over cream results. */
  tone: "dark" | "light";
  isDemo: boolean;
  /** When set, the wordmark becomes a button that returns to the start screen. */
  onHome?: () => void;
  /** Transparent with a fade, for floating over the live camera. */
  isOverlay?: boolean;
}

export function TopBar({ tone, isDemo, onHome, isOverlay = false }: TopBarProps): React.JSX.Element {
  const isDark = tone === "dark";
  const surface = isOverlay
    ? "bg-linear-to-b from-moss-night/80 to-transparent"
    : isDark
      ? "border-b border-lichen/10"
      : "border-b border-ink/10";

  const wordmark = (
    <span className={`font-display text-2xl font-bold tracking-tight ${isDark ? "text-lichen" : "text-ink"}`}>
      Fixie
    </span>
  );

  return (
    <header
      className={`relative z-10 flex h-[calc(4.75rem+var(--safe-top))] shrink-0 items-center justify-center px-5 pt-[var(--safe-top)] ${surface}`}
    >
      {onHome ? (
        <button type="button" onClick={onHome} aria-label="Fixie, back to start" className="flex min-h-11 items-center px-2">
          {wordmark}
        </button>
      ) : (
        <p>{wordmark}</p>
      )}
      {isDemo && (
        <p
          // Pinned to the right, out of the flow, so it never pulls "Fixie" off centre.
          className={`absolute top-[calc(var(--safe-top)+2.375rem)] right-5 flex -translate-y-1/2 items-center gap-1.5 text-xs font-bold tracking-wide uppercase ${
            isDark ? "text-honey-light" : "text-honey"
          }`}
        >
          <Icon name="sparkle" size={14} className="fill-current" />
          Demo mode
        </p>
      )}
    </header>
  );
}
