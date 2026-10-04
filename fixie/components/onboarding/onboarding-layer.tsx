// Six slow fireflies, placed as in the mockup. Each wanders its own loop (see
// .firefly.is-wandering in globals.css), so no two move in step.
// Custom properties feed the keyframes; React passes them through as inline styles.
type FireflyStyle = React.CSSProperties & Record<`--${string}`, string>;

const FIREFLIES: FireflyStyle[] = [
  { top: "14%", left: "12%", "--wander": "11s", "--x1": "14px", "--y1": "-10px", "--x2": "26px", "--y2": "6px", "--x3": "8px", "--y3": "16px" },
  { top: "20%", right: "13%", "--size": "4px", "--wander": "9s", "--blink": "3s", "--delay": "-2s", "--x1": "-12px", "--y1": "8px", "--x2": "-20px", "--y2": "-6px", "--x3": "-6px", "--y3": "-14px" },
  { top: "40%", left: "7%", "--size": "6px", "--wander": "13s", "--delay": "-4s", "--x1": "10px", "--y1": "-18px", "--x2": "22px", "--y2": "-4px", "--x3": "6px", "--y3": "10px" },
  { top: "46%", right: "8%", "--wander": "10s", "--blink": "2s", "--delay": "-1s", "--x1": "-16px", "--y1": "-12px", "--x2": "-6px", "--y2": "-24px", "--x3": "4px", "--y3": "-8px" },
  { top: "66%", left: "10%", "--size": "4px", "--wander": "8s", "--blink": "2.8s", "--delay": "-3s", "--x1": "12px", "--y1": "10px", "--x2": "-4px", "--y2": "18px", "--x3": "-10px", "--y3": "4px" },
  { top: "70%", right: "12%", "--wander": "12s", "--delay": "-6s", "--x1": "-10px", "--y1": "12px", "--x2": "8px", "--y2": "20px", "--x3": "14px", "--y3": "4px" },
];

/**
 * The full-screen green stage the first-launch intro and its questions share:
 * a soft fern glow and drifting fireflies. It covers the app; the caller makes
 * the screen behind it inert.
 */
export function OnboardingLayer({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-moss-deep bg-[radial-gradient(circle_at_50%_36%,color-mix(in_srgb,var(--fern)_32%,transparent),transparent_40%)] text-lichen">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FIREFLIES.map((style, index) => (
          <span key={index} className="firefly is-wandering" style={style} />
        ))}
      </div>
      {children}
    </div>
  );
}
