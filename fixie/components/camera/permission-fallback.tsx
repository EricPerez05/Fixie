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
    <div className="flex flex-col items-start gap-5">
      <h2 className="font-display text-2xl leading-tight text-lichen">{copy.heading}</h2>
      <p className="max-w-[34ch] text-base leading-relaxed text-lichen/85">{copy.body}</p>
      <div className="flex flex-wrap items-center gap-3">
        <UploadButton onFile={onFile} label="Upload a photo" variant="primary" />
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-full px-4 text-base text-lichen underline decoration-glimmer decoration-2 underline-offset-4"
        >
          Try the camera again
        </button>
      </div>
    </div>
  );
}
