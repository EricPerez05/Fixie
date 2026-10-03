"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { useCamera } from "@/hooks/use-camera";
import { useScan, type ScanState } from "@/hooks/use-scan";
import { captureFrame } from "@/lib/camera/capture-frame";
import { loadImageFile } from "@/lib/camera/load-image";
import { log } from "@/lib/log";
import { CameraView } from "./camera/camera-view";
import { ScanButton } from "./camera/scan-button";
import { UploadButton } from "./camera/upload-button";
import { PermissionFallback } from "./camera/permission-fallback";
import { ResultCard, ScanAgainButton } from "./result/result-card";
import { InspectingOverlay } from "./ui/inspecting-overlay";
import { Sheet } from "./ui/sheet";

interface ScanScreenProps {
  isDemo: boolean;
}

/** Composes camera, scan and result. All data access lives in the hooks. */
export function ScanScreen({ isDemo }: ScanScreenProps): React.JSX.Element {
  const camera = useCamera();
  const scanner = useScan({ isDemo });
  const sheetHeadingId = useId();
  const [captureError, setCaptureError] = useState<string | null>(null);

  const { state } = scanner;
  const isCameraLive = camera.status === "active";
  const isSheetOpen = state.status === "success" || state.status === "error" || captureError !== null;

  // Move focus to the result heading so screen readers and keyboards land on
  // the answer instead of the now-hidden shutter button.
  useEffect(() => {
    if (isSheetOpen) document.getElementById(sheetHeadingId)?.focus();
  }, [isSheetOpen, sheetHeadingId]);

  function scanFromCamera(): void {
    const video = camera.videoRef.current;
    if (!video) return;
    try {
      const image = captureFrame(video);
      // Freeze the preview so the user sees the exact frame being judged.
      video.pause();
      void scanner.scan(image);
    } catch (error) {
      log.warn("capture.failed", { reason: error instanceof Error ? error.message : "Unknown" });
      setCaptureError("The camera wasn't ready. Hold still for a moment and try again.");
    }
  }

  async function scanFromFile(file: File): Promise<void> {
    try {
      const image = captureFrame(await loadImageFile(file));
      void scanner.scan(image);
    } catch (error) {
      log.warn("upload.failed", { reason: error instanceof Error ? error.message : "Unknown" });
      setCaptureError("That file couldn't be opened as a photo. Try a JPEG or PNG.");
    }
  }

  function scanAgain(): void {
    setCaptureError(null);
    scanner.reset();
    void camera.videoRef.current?.play().catch(() => undefined);
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative h-dvh w-full overflow-hidden bg-moss-deep text-lichen">
        <CameraView videoRef={camera.videoRef} isVisible={isCameraLive} />

        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-moss-deep/80 to-transparent px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
          <p className="font-display text-2xl font-bold text-glimmer">Fixie</p>
          {isDemo && (
            <p className="rounded-full bg-glimmer-soft px-3 py-1 text-sm font-semibold text-moss-deep">
              Demo mode
            </p>
          )}
        </header>

        {!isCameraLive && (
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            {camera.status === "denied" || camera.status === "unavailable" ? (
              <PermissionFallback
                reason={camera.status}
                onFile={(file) => void scanFromFile(file)}
                onRetry={() => void camera.start()}
              />
            ) : (
              <Welcome
                isResuming={camera.status === "paused"}
                isRequesting={camera.status === "requesting"}
                onOpenCamera={() => void camera.start()}
                onFile={(file) => void scanFromFile(file)}
              />
            )}
          </div>
        )}

        {isCameraLive && state.status === "idle" && !captureError && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-linear-to-t from-moss-deep/85 to-transparent pt-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <p className="text-base text-lichen">Fill the frame with one item</p>
            <ScanButton onScan={scanFromCamera} isBusy={false} />
          </div>
        )}

        {state.status === "loading" && <InspectingOverlay />}

        <AnimatePresence>
          {isSheetOpen && (
            <Sheet key="result" labelledBy={sheetHeadingId}>
              <SheetBody
                state={state}
                captureError={captureError}
                headingId={sheetHeadingId}
                onScanAgain={scanAgain}
                onRetry={() => void scanner.retry()}
              />
            </Sheet>
          )}
        </AnimatePresence>

        <p aria-live="polite" className="sr-only">
          {announcement(state)}
        </p>
      </main>
    </MotionConfig>
  );
}

function Welcome({
  isResuming,
  isRequesting,
  onOpenCamera,
  onFile,
}: {
  isResuming: boolean;
  isRequesting: boolean;
  onOpenCamera: () => void;
  onFile: (file: File) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-start gap-5">
      <h1 className="max-w-[12ch] font-display text-[2.6rem] leading-[1.05] font-bold text-lichen">
        Every bit of junk has a second life.
      </h1>
      <p className="max-w-[34ch] text-lg leading-relaxed text-lichen/85">
        Show a fairy something you&rsquo;re about to throw away. You&rsquo;ll learn what it&rsquo;s made of, how to
        recycle it, and what you could make from it instead.
      </p>
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
        {/* iOS only grants the camera from a user gesture, so we never auto-start. */}
        <button
          type="button"
          onClick={onOpenCamera}
          disabled={isRequesting}
          className="min-h-13 rounded-full bg-glimmer px-8 text-lg font-semibold text-moss-deep disabled:opacity-70"
        >
          {isRequesting ? "Waiting for camera…" : isResuming ? "Resume camera" : "Open camera"}
        </button>
        <UploadButton onFile={onFile} />
      </div>
    </div>
  );
}

function SheetBody({
  state,
  captureError,
  headingId,
  onScanAgain,
  onRetry,
}: {
  state: ScanState;
  captureError: string | null;
  headingId: string;
  onScanAgain: () => void;
  onRetry: () => void;
}): React.JSX.Element | null {
  if (state.status === "success") {
    return <ResultCard result={state.result} headingId={headingId} onScanAgain={onScanAgain} />;
  }

  const message = captureError ?? (state.status === "error" ? state.message : null);
  if (!message) return null;
  const canRetry = state.status === "error" && state.canRetry && !captureError;

  return (
    <div className="flex flex-col items-start gap-4">
      <h2 id={headingId} tabIndex={-1} className="font-display text-2xl leading-tight font-bold outline-none">
        That scan didn&apos;t make it
      </h2>
      <p className="leading-relaxed text-ink-soft">{message}</p>
      {canRetry && <ScanAgainButton onClick={onRetry} label="Try that photo again" />}
      <button
        type="button"
        onClick={onScanAgain}
        className="min-h-12 w-full rounded-full border-2 border-moss px-6 text-base font-semibold text-moss"
      >
        Take a new photo
      </button>
    </div>
  );
}

function announcement(state: ScanState): string {
  switch (state.status) {
    case "loading":
      return "Scanning. The fairies are inspecting your item.";
    case "success":
      return state.result.status === "ok" && state.result.item
        ? `Found ${state.result.item}.`
        : "The fairies couldn't identify that item.";
    case "error":
      return state.message;
    default:
      return "";
  }
}
