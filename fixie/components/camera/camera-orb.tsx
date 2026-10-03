import { Icon } from "@/components/ui/icon";

interface CameraOrbProps {
  onPress: () => void;
  isWaiting: boolean;
  label: string;
}

/**
 * The big gold orb on the start screen. It opens the camera; the actual
 * capture happens with the shutter once the preview is live.
 */
export function CameraOrb({ onPress, isWaiting, label }: CameraOrbProps): React.JSX.Element {
  return (
    <div className="relative mx-auto grid w-full place-items-center pt-6 pb-2">
      <span aria-hidden="true" className="firefly top-14 left-[18%]" />
      <span aria-hidden="true" className="firefly top-24 right-[16%] [animation-delay:-1.2s]" />
      <span aria-hidden="true" className="firefly bottom-0 left-[14%] [animation-delay:-2.1s]" />
      <button
        type="button"
        onClick={onPress}
        disabled={isWaiting}
        aria-label={label}
        className="h-32 w-32 rounded-full border border-glimmer/40 bg-lichen/5 p-3 shadow-[0_0_0_9px_color-mix(in_srgb,var(--lichen)_5%,transparent)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] disabled:opacity-70"
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-glimmer text-moss-deep shadow-[0_9px_28px_color-mix(in_srgb,var(--moss-night)_45%,transparent)]">
          <Icon name="camera" size={36} />
        </span>
      </button>
    </div>
  );
}
