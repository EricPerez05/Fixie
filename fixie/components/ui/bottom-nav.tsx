import { Icon } from "./icon";

interface BottomNavProps {
  /** Opens the camera, same as the big orb. */
  onScan: () => void;
  /** Returns to the start screen. */
  onHome: () => void;
  /** True while the camera permission prompt is open, so a second tap can't stack requests. */
  isScanBusy: boolean;
}

// The bar is 4rem tall and floats 0.75rem above the safe area. Screens that
// show it reserve pb-[calc(5.5rem+var(--safe-bottom))] (bar + gap + breathing
// room) so no content sits underneath; see scan-screen.tsx. Change both together.

/**
 * Floating, rounded navigation bubble near the bottom of the start screen:
 * Grove on the left, a raised camera button in the middle, Home on the right.
 *
 * Grove has no screen yet, so it's marked "Soon" and announced as coming
 * soon rather than being a button that silently does nothing.
 */
export function BottomNav({ onScan, onHome, isScanBusy }: BottomNavProps): React.JSX.Element {
  return (
    <nav
      aria-label="Main"
      className="absolute inset-x-5 bottom-[calc(0.75rem+var(--safe-bottom))] z-20 mx-auto max-w-sm"
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center rounded-full border border-lichen/12 bg-moss-night/85 px-3 shadow-[0_14px_32px_-10px_color-mix(in_srgb,var(--moss-night)_80%,transparent)] backdrop-blur-md">
        <button
          type="button"
          aria-disabled="true"
          aria-label="Grove, coming soon"
          className="relative flex min-h-11 flex-col items-center justify-center gap-0.5 justify-self-center px-3 text-lichen/55"
        >
          <Icon name="forest" size={22} />
          <span className="text-[11px] font-bold tracking-wide">Grove</span>
          <span
            aria-hidden="true"
            className="absolute -top-1.5 right-0 rounded-full bg-blossom px-1.5 text-[9px] leading-4 font-bold text-moss-night"
          >
            Soon
          </span>
        </button>

        {/* Raised above the bar, so the main action reads first. */}
        <button
          type="button"
          onClick={onScan}
          disabled={isScanBusy}
          aria-label="Scan an item"
          className="-mt-7 grid h-16 w-16 place-items-center rounded-full border-[5px] border-moss-deep bg-glimmer text-moss-deep shadow-[0_10px_24px_-6px_color-mix(in_srgb,var(--moss-night)_70%,transparent)] transition-transform active:scale-95 disabled:opacity-70"
        >
          <Icon name="camera" size={26} />
        </button>

        <button
          type="button"
          onClick={onHome}
          aria-current="page"
          className="flex min-h-11 flex-col items-center justify-center gap-0.5 justify-self-center px-3 text-lichen"
        >
          <Icon name="home" size={22} />
          <span className="text-[11px] font-bold tracking-wide">Home</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-glimmer" />
        </button>
      </div>
    </nav>
  );
}
