import type { RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isVisible: boolean;
}

/**
 * Full-bleed rear-camera preview. The <video> stays mounted even while hidden
 * so useCamera() always has an element to attach the stream to.
 */
export function CameraView({ videoRef, isVisible }: CameraViewProps): React.JSX.Element {
  return (
    <>
      {/* iOS Safari ignores autoPlay unless the video is also muted and inline,
          and without playsInline it hijacks the screen with its own player. */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Camera preview"
        className={`absolute inset-0 h-full w-full object-cover ${isVisible ? "" : "invisible"}`}
      />
      {isVisible && <ViewfinderCorners />}
    </>
  );
}

function ViewfinderCorners(): React.JSX.Element {
  const corner = "absolute h-10 w-10 border-glimmer/90";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-[22%] bottom-[30%]">
      <span className={`${corner} left-0 top-0 rounded-tl-2xl border-l-4 border-t-4`} />
      <span className={`${corner} right-0 top-0 rounded-tr-2xl border-r-4 border-t-4`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4`} />
      <span className={`${corner} bottom-0 right-0 rounded-br-2xl border-b-4 border-r-4`} />
    </div>
  );
}
