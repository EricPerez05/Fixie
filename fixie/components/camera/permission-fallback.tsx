import { UploadButton } from "./upload-button";

interface PermissionFallbackProps {
  reason: "denied" | "unavailable";
  onFile: (file: File) => void;
  onRetry: () => void;
}

const COPY = {
  denied: {
    heading: "Fixie can't see through your camera",
    body: "Camera access is turned off for this site. Turn it on in your browser's site settings, or take a photo and upload it.",
  },
  unavailable: {
    heading: "No camera available here",
    body: "This browser couldn't open a camera. It may be in use by another app. You can still take a photo and upload it.",
  },
} as const;

/** Shown when the live camera can't start. Never leaves the user at a blank screen. */
export function PermissionFallback({ reason, onFile, onRetry }: PermissionFallbackProps): React.JSX.Element {
  const copy = COPY[reason];
  return (
    <section className="flex flex-col items-center px-2 text-center">
      <h1 className="font-display text-[1.9rem] leading-[1.1] font-semibold tracking-tight text-lichen">
        {copy.heading}
      </h1>
      <p className="mt-3 max-w-[32ch] text-[15px] leading-relaxed text-lichen/80">{copy.body}</p>
      <div className="mt-8 flex flex-col items-center gap-2">
        <UploadButton onFile={onFile} variant="primary" />
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 text-sm font-semibold text-honey-light underline decoration-honey-light/50 underline-offset-4"
        >
          Try the camera again
        </button>
      </div>
    </section>
  );
}
