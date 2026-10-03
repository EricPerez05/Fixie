import type { ReactNode } from "react";

/**
 * On laptops and monitors, shows the app inside a realistic phone (titanium
 * edge, black bezel, Dynamic Island, side buttons, home indicator) on a
 * forest backdrop, so the mobile layout can be tested and demoed without
 * DevTools. On phones and tablets every layer collapses to full-screen and
 * adds nothing.
 *
 * Keyed on the `desk` variant (wide screen + mouse), not width alone, so a
 * phone in landscape never gets squeezed into a tiny frame. On very short
 * windows the screen keeps a 640px floor and the page scrolls instead.
 */
export function DeviceFrame({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="relative h-dvh w-full desk:flex desk:h-auto desk:min-h-dvh desk:items-center desk:justify-center desk:overflow-hidden desk:bg-linear-145 desk:from-sage-shade desk:via-sage desk:to-sage-shade desk:p-6">
      <Backdrop />

      {/* Titanium edge */}
      <div className="relative h-full w-full desk:h-auto desk:w-auto desk:rounded-[64px] desk:bg-linear-135 desk:from-device-edge-light desk:via-device-edge desk:to-device-edge-dark desk:p-0.75 desk:shadow-[0_30px_80px_-10px_color-mix(in_srgb,var(--moss-night)_45%,transparent),0_6px_18px_color-mix(in_srgb,var(--moss-night)_20%,transparent)]">
        <SideButtons />

        {/* Glass bezel */}
        <div className="h-full w-full desk:h-auto desk:w-auto desk:rounded-[61px] desk:bg-device-bezel desk:p-3">
          {/*
            The screen. On desktop it fakes the insets of a real phone so the
            app keeps its content clear of the island and home indicator.
          */}
          <div className="relative h-full w-full overflow-hidden desk:h-[min(852px,calc(100dvh-5rem))] desk:min-h-160 desk:w-98.25 desk:rounded-[50px] desk:[--safe-bottom:22px] desk:[--safe-top:48px] desk:[&_*]:[scrollbar-width:none]">
            {children}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-2.75 left-1/2 z-50 hidden h-9 w-31 -translate-x-1/2 items-center justify-end rounded-full bg-device-bezel pr-3 desk:flex"
            >
              <span className="h-3 w-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--ink-soft),var(--device-bezel)_70%)]" />
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-1.25 w-33.5 -translate-x-1/2 rounded-full bg-paper mix-blend-difference desk:block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Action button and volume rocker on the left, power on the right. */
function SideButtons(): React.JSX.Element {
  const button =
    "absolute hidden w-1 bg-linear-to-b from-device-edge-light via-device-edge to-device-edge-dark desk:block";
  return (
    <div aria-hidden="true">
      <span className={`${button} top-30 -left-1 h-8 rounded-l-sm`} />
      <span className={`${button} top-46 -left-1 h-16 rounded-l-sm`} />
      <span className={`${button} top-66 -left-1 h-16 rounded-l-sm`} />
      <span className={`${button} top-52 -right-1 h-24 rounded-r-sm`} />
    </div>
  );
}

/** Soft glows and fern-like rings behind the phone; desktop only. */
function Backdrop(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden desk:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,color-mix(in_srgb,var(--glimmer)_45%,transparent),transparent_20%),radial-gradient(circle_at_82%_70%,color-mix(in_srgb,var(--sage-shade)_60%,transparent),transparent_24%)]" />
      <div className="absolute -bottom-[20vh] -left-[24vw] h-[78vh] w-[44vw] rotate-20 rounded-full bg-[repeating-radial-gradient(ellipse_at_bottom,var(--moss)_0_7%,transparent_8%_15%)] opacity-30 blur-[2px]" />
      <div className="absolute -top-[22vh] -right-[25vw] h-[78vh] w-[44vw] -rotate-18 rounded-full bg-[repeating-radial-gradient(ellipse_at_top,var(--fern)_0_6%,transparent_7%_14%)] opacity-30 blur-[2px]" />
    </div>
  );
}
