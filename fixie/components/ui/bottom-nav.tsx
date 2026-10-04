import type { IconName } from "./icon";
import { Icon } from "./icon";

export type NavTab = "grove" | "home";

interface BottomNavProps {
  /** The screen being shown, highlighted in the bar. */
  active: NavTab;
  /** Opens the camera, same as the big orb. */
  onScan: () => void;
  onGrove: () => void;
  /** Returns to the start screen. */
  onHome: () => void;
  /** True while the camera permission prompt is open, so a second tap can't stack requests. */
  isScanBusy: boolean;
}

// The bar is 4rem tall and floats 0.75rem above the safe area. Screens that
// show it reserve pb-[calc(5.5rem+var(--safe-bottom))] (bar + gap + breathing
// room) so no content sits underneath; see scan-screen.tsx and grove-screen.tsx.
// Change them together.

/**
 * Floating, rounded navigation bubble near the bottom of the screen:
 * Grove on the left, a raised camera button in the middle, Home on the right.
 */
export function BottomNav({ active, onScan, onGrove, onHome, isScanBusy }: BottomNavProps): React.JSX.Element {
  return (
    <nav
      aria-label="Main"
      className="absolute inset-x-5 bottom-[calc(0.75rem+var(--safe-bottom))] z-20 mx-auto max-w-sm"
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center rounded-full border border-lichen/12 bg-moss-night/85 px-3 shadow-[0_14px_32px_-10px_color-mix(in_srgb,var(--moss-night)_80%,transparent)] backdrop-blur-md">
        <TabButton icon="forest" label="Grove" isActive={active === "grove"} onClick={onGrove} />

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

        <TabButton icon="home" label="Home" isActive={active === "home"} onClick={onHome} />
      </div>
    </nav>
  );
}

function TabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: IconName;
  label: string;
  isActive: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 flex-col items-center justify-center gap-0.5 justify-self-center px-3 transition-colors ${
        isActive ? "text-lichen" : "text-lichen/55 hover:text-lichen/80"
      }`}
    >
      <Icon name={icon} size={22} />
      <span className="text-[11px] font-bold tracking-wide">{label}</span>
      <span aria-hidden="true" className={`h-1 w-1 rounded-full ${isActive ? "bg-glimmer" : "bg-transparent"}`} />
    </button>
  );
}
