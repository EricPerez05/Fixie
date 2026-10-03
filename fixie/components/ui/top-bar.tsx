import { Icon } from "./icon";

interface TopBarProps {
  /** "dark" over the forest-green scan screens, "light" over cream results. */
  tone: "dark" | "light";
  isDemo: boolean;
  /** When set, the brand becomes a button that returns to the start screen. */
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

  const brand = (
    <>
      <span
        className={`grid h-9 w-9 -rotate-6 place-items-center rounded-[50%_50%_48%_52%] ${
          isDark ? "bg-glimmer text-moss-deep" : "bg-moss text-glimmer"
        }`}
      >
        <Icon name="leaf" size={22} className="rotate-6" />
      </span>
      <span className={`font-display text-2xl font-bold tracking-tight ${isDark ? "text-lichen" : "text-ink"}`}>
        Fixie
      </span>
    </>
  );

  return (
    <header
      className={`relative z-10 flex h-[calc(4.75rem+var(--safe-top))] shrink-0 items-center gap-3 px-5 pt-[var(--safe-top)] ${surface}`}
    >
      {onHome ? (
        <button type="button" onClick={onHome} aria-label="Fixie, back to start" className="flex min-h-11 items-center gap-2">
          {brand}
        </button>
      ) : (
        <p className="flex items-center gap-2">{brand}</p>
      )}
      {isDemo && (
        <p
          className={`ml-auto flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase ${
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
