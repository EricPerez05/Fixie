import { Icon } from "@/components/ui/icon";

interface CameraOrbProps {
  onPress: () => void;
  isWaiting: boolean;
  label: string;
}

// The orb's size, shared so the firefly ring scales with it on every screen.
const ORB_SIZE = "clamp(96px,16cqh,128px)";

/**
 * Fireflies in a loose ring around the orb. `angle` is in degrees (0 = right,
 * 90 = straight down); `radius` is in orb-widths from its centre. Angles from
 * about 35° to 145° are left empty so none sit on the "Tap to discover" text
 * below. Sizes, speeds and delays differ so they never pulse in step.
 */
const FIREFLIES = [
  { angle: -90, radius: 0.92, size: 4, seconds: 3.2, delay: -0.4, drift: "up" },
  { angle: -60, radius: 1.03, size: 3, seconds: 2.6, delay: -1.8, drift: "side" },
  { angle: -30, radius: 0.81, size: 5, seconds: 3.6, delay: -0.9, drift: "up" },
  { angle: 0, radius: 1.06, size: 4, seconds: 2.9, delay: -2.4, drift: "side" },
  { angle: 25, radius: 0.88, size: 3, seconds: 3.9, delay: -1.1, drift: "up" },
  { angle: 155, radius: 0.9, size: 5, seconds: 3.1, delay: -0.2, drift: "side" },
  { angle: 180, radius: 1.03, size: 3, seconds: 2.7, delay: -2.9, drift: "up" },
  { angle: -150, radius: 0.86, size: 4, seconds: 3.4, delay: -1.5, drift: "side" },
  { angle: -120, radius: 1.08, size: 5, seconds: 4.1, delay: -0.7, drift: "up" },
  { angle: -75, radius: 0.69, size: 3, seconds: 2.5, delay: -2.1, drift: "up" },
  { angle: -105, radius: 1.17, size: 3, seconds: 3.8, delay: -3.2, drift: "side" },
  { angle: -15, radius: 1.22, size: 3, seconds: 3.3, delay: -1.3, drift: "up" },
  { angle: -165, radius: 1.2, size: 4, seconds: 2.8, delay: -0.5, drift: "side" },
] as const;

function fireflyStyle({ angle, radius, size, seconds, delay }: (typeof FIREFLIES)[number]): React.CSSProperties {
  const radians = (angle * Math.PI) / 180;
  const x = (Math.cos(radians) * radius).toFixed(3);
  const y = (Math.sin(radians) * radius).toFixed(3);
  return {
    left: `calc(50% + ${x} * ${ORB_SIZE} - ${size / 2}px)`,
    top: `calc(50% + ${y} * ${ORB_SIZE} - ${size / 2}px)`,
    width: size,
    height: size,
    animationDuration: `${seconds}s`,
    animationDelay: `${delay}s`,
  };
}

/**
 * The big gold orb on the start screen. It opens the camera; the actual
 * capture happens with the shutter once the preview is live.
 */
export function CameraOrb({ onPress, isWaiting, label }: CameraOrbProps): React.JSX.Element {
  return (
    <div className="relative mx-auto grid w-full place-items-center py-[clamp(8px,2cqh,16px)]">
      {FIREFLIES.map((firefly) => (
        <span
          key={`${firefly.angle}-${firefly.radius}`}
          aria-hidden="true"
          className={`firefly ${firefly.drift === "side" ? "firefly-side" : ""}`}
          style={fireflyStyle(firefly)}
        />
      ))}
      <button
        type="button"
        onClick={onPress}
        disabled={isWaiting}
        aria-label={label}
        className="relative h-[clamp(96px,16cqh,128px)] w-[clamp(96px,16cqh,128px)] rounded-full border border-glimmer/40 bg-lichen/5 p-3 shadow-[0_0_0_9px_color-mix(in_srgb,var(--lichen)_5%,transparent)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] disabled:opacity-70"
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-glimmer text-moss-deep shadow-[0_9px_28px_color-mix(in_srgb,var(--moss-night)_45%,transparent)]">
          <Icon name="camera" size={36} />
        </span>
      </button>
    </div>
  );
}
