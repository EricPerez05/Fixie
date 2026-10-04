import { Icon } from "./icon";
import { Wordmark } from "./wordmark";

interface TopBarProps {
  /** "dark" over the forest-green scan screens, "light" over cream results. */
  tone: "dark" | "light";
  isDemo: boolean;
  /** When set, the brand becomes a button that returns to the start screen. */
  onHome?: () => void;
  /** Transparent with a fade, for floating over the live camera. */
  isOverlay?: boolean;
  /** When set, shows a button that reopens "Tell the fairies about you". */
  onEditProfile?: () => void;
}

export function TopBar({ tone, isDemo, onHome, isOverlay = false, onEditProfile }: TopBarProps): React.JSX.Element {
  const isDark = tone === "dark";
  const surface = isOverlay
    ? "bg-linear-to-b from-moss-night/80 to-transparent"
    : isDark
      ? "border-b border-lichen/10"
      : "border-b border-ink/10";

  return (
    <header
      className={`relative z-10 flex h-[calc(4.75rem+var(--safe-top))] shrink-0 items-center gap-3 px-5 pt-[var(--safe-top)] ${surface}`}
    >
      {onHome ? (
        <button type="button" onClick={onHome} aria-label="Fixie, back to start" className="flex min-h-11 shrink-0 items-center">
          <Wordmark tone={tone} isDecorative />
        </button>
      ) : (
        <Wordmark tone={tone} className="shrink-0" />
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
      {onEditProfile && (
        <button
          type="button"
          onClick={onEditProfile}
          aria-label="Your fairy profile"
          className={`grid h-11 w-11 place-items-center rounded-full border ${isDemo ? "" : "ml-auto"} ${
            isDark ? "border-lichen/30 text-lichen" : "border-ink/20 text-ink"
          }`}
        >
          <Icon name="wand" size={20} />
        </button>
      )}
    </header>
  );
}
