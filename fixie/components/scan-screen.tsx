"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import { useCamera } from "@/hooks/use-camera";
import { useGrove } from "@/hooks/use-grove";
import { useIntroSeen } from "@/hooks/use-intro-seen";
import { useLocation } from "@/hooks/use-location";
import { useOnboarding } from "@/hooks/use-onboarding";
import { EMPTY_PREFERENCES, usePreferences } from "@/hooks/use-preferences";
import { useScan, type ScanState } from "@/hooks/use-scan";
import type { Preferences } from "@/lib/scan/schema";
import { captureFrame } from "@/lib/camera/capture-frame";
import { loadImageFile } from "@/lib/camera/load-image";
import { log } from "@/lib/log";
import { CameraOrb } from "./camera/camera-orb";
import { CameraView } from "./camera/camera-view";
import { PermissionFallback } from "./camera/permission-fallback";
import { GroveScreen } from "./grove/grove-screen";
import { Intro } from "./onboarding/intro";
import { IntroQuestions } from "./onboarding/intro-questions";
import { OnboardingLayer } from "./onboarding/onboarding-layer";
import { ScanButton } from "./camera/scan-button";
import { UploadButton } from "./camera/upload-button";
import { ResultCard, ResultHeading, ScanAgainButton } from "./result/result-card";
import { BottomNav, type NavTab } from "./ui/bottom-nav";
import { Icon } from "./ui/icon";
import { InspectingOverlay } from "./ui/inspecting-overlay";
import { LocationField } from "./ui/location-field";
import { Panel } from "./ui/panel";
import { PetalShower } from "./ui/petal-shower";
import { ProfileSheet } from "./ui/profile-sheet";
import { TopBar } from "./ui/top-bar";

interface ScanScreenProps {
  isDemo: boolean;
}

/** Composes camera, scan and result. All data access lives in the hooks. */
export function ScanScreen({ isDemo }: ScanScreenProps): React.JSX.Element {
  const camera = useCamera();
  const { location, setLocation } = useLocation();
  const { preferences, setPreferences } = usePreferences();
  const grove = useGrove();
  const scanner = useScan({ isDemo, location, preferences, onScanned: grove.addScan });
  const isClient = useIsClient();
  const { hasSeenIntro, markIntroSeen } = useIntroSeen();
  const onboarding = useOnboarding();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const panelHeadingId = useId();
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [tab, setTab] = useState<NavTab>("home");

  const { state } = scanner;
  const isCameraLive = camera.status === "active";
  const isPanelOpen = state.status === "success" || state.status === "error" || captureError !== null;
  // Brand-new people only: anyone who answered or skipped the questions has
  // preferences saved. Waits for the browser, since storage can't be read on
  // the server. Demo mode never shows it, so a demo isn't interrupted.
  const isIntroShowing = isClient && !isDemo && preferences === null && !hasSeenIntro;
  const isScreenCovered = isIntroShowing || isEditingProfile;

  // Saving or skipping the intro's questions both end the intro for good.
  const finishIntro = useCallback(
    (value: Preferences): void => {
      setPreferences(value);
      markIntroSeen();
    },
    [setPreferences, markIntroSeen],
  );

  const closeSheet = useCallback((): void => setIsEditingProfile(false), []);
  const saveProfile = useCallback(
    (value: Preferences): void => {
      setPreferences(value);
      setIsEditingProfile(false);
    },
    [setPreferences],
  );
  const editProfile = (): void => setIsEditingProfile(true);

  // Move focus to the result heading so screen readers and keyboards land on
  // the answer instead of the now-hidden shutter button.
  useEffect(() => {
    // preventScroll: the heading starts below the screen while the panel slides
    // up, and a plain focus() scrolls the app container to reach it, leaving the
    // panel stuck above the screen.
    if (isPanelOpen) document.getElementById(panelHeadingId)?.focus({ preventScroll: true });
  }, [isPanelOpen, panelHeadingId]);

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

  function goHome(): void {
    scanAgain();
    camera.stop();
    setTab("home");
  }

  // The camera and its permission fallback belong to Home, so leave the Grove
  // first; otherwise a denied camera would show nothing from the Grove.
  function openCamera(): void {
    setTab("home");
    void camera.start();
  }

  const onFile = (file: File): void => void scanFromFile(file);

  return (
    <MotionConfig reducedMotion="user">
      {/* A size container: screens size type and spacing in cqh so everything
          fits one screen, with no scrolling, from short phones to the desktop frame. */}
      {/* On short screens (under 640px of app height) the home screen drops its
          two secondary lines so everything still fits without scrolling. */}
      <main className="relative h-full w-full overflow-clip [container-type:size] bg-moss-deep bg-[radial-gradient(circle_at_50%_42%,color-mix(in_srgb,var(--fern)_25%,transparent),transparent_34%)] text-lichen">
        {/* "contents" keeps the layout as is; inert keeps focus inside the intro or the open sheet. */}
        <div inert={isScreenCovered} className="contents">
        <CameraView videoRef={camera.videoRef} isVisible={isCameraLive} />

        {isCameraLive ? (
          <>
            <div className="absolute inset-x-0 top-0">
              <TopBar tone="dark" isDemo={isDemo} onHome={goHome} isOverlay onEditProfile={editProfile} />
            </div>
            {state.status === "idle" && !captureError && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-moss-night/90 to-transparent px-6 pt-16 pb-[max(2rem,var(--safe-bottom))]">
                <p className="mb-4 text-center text-[15px] text-lichen">Fill the frame with one item</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                  <div className="justify-self-start">
                    <UploadButton onFile={onFile} variant="icon" label="Upload a photo instead" />
                  </div>
                  <ScanButton onScan={scanFromCamera} isBusy={false} />
                  <button
                    type="button"
                    onClick={goHome}
                    aria-label="Close camera"
                    className="grid h-13 w-13 place-items-center justify-self-end rounded-full border border-lichen/30 bg-moss-night/50 text-lichen backdrop-blur-sm"
                  >
                    <Icon name="close" size={22} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          tab === "home" && (camera.status === "denied" || camera.status === "unavailable") ? (
            <div className="flex h-full flex-col">
              <TopBar tone="dark" isDemo={isDemo} onEditProfile={editProfile} />
              <div className="flex min-h-0 flex-1 flex-col justify-[safe_center] px-6 pb-[calc(5.5rem+var(--safe-bottom))]">
                <PermissionFallback reason={camera.status} onFile={onFile} onRetry={() => void camera.start()} />
              </div>
              <BottomNav
                active="home"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onHome={goHome}
                isScanBusy={false}
              />
            </div>
          ) : tab === "grove" ? (
            <div className="relative h-full">
              <GroveScreen
                entries={grove.entries}
                onOpenEntry={(entry) => scanner.show(entry.result)}
                onScan={openCamera}
                // Plant branches without scanning while building the Grove. The
                // condition is inlined at build time, so production never ships it.
                devTools={
                  process.env.NODE_ENV === "development"
                    ? { addSamples: grove.addSamples, clear: grove.clear }
                    : undefined
                }
              />
              <BottomNav
                active="grove"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onHome={goHome}
                isScanBusy={camera.status === "requesting"}
              />
            </div>
          ) : (
            <div className="relative h-full">
              {/* Behind everything: the grid and header below are positioned, so they paint on top. */}
              <PetalShower />
              {/* Floats over the welcome grid so the orb can sit at the middle of the
                  whole screen, not the middle of the space below the header. */}
              <div className="absolute inset-x-0 top-0 z-10">
                <TopBar tone="dark" isDemo={isDemo} onEditProfile={editProfile} />
              </div>
              <Welcome
                isResuming={camera.status === "paused"}
                isRequesting={camera.status === "requesting"}
                onOpenCamera={() => void camera.start()}
                onExample={scanner.showExample}
                onFile={onFile}
                location={location}
                onLocationChange={setLocation}
              />
              <BottomNav
                active="home"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onHome={goHome}
                isScanBusy={camera.status === "requesting"}
              />
            </div>
          )
        )}

        {state.status === "loading" && <InspectingOverlay />}

        <Panel isOpen={isPanelOpen} onClose={scanAgain} labelledBy={panelHeadingId}>
          <PanelBody
            state={state}
            captureError={captureError}
            headingId={panelHeadingId}
            onScanAgain={scanAgain}
            onRetry={() => void scanner.retry()}
          />
        </Panel>
        </div>

        {isIntroShowing && (
          <OnboardingLayer>
            {onboarding.view === "intro" ? (
              <Intro slide={onboarding.slide} onGoToSlide={onboarding.goToSlide} onOpenQuestions={onboarding.openQuestions} />
            ) : (
              <IntroQuestions
                onBack={onboarding.backToIntro}
                onSave={finishIntro}
                onSkip={() => finishIntro(EMPTY_PREFERENCES)}
              />
            )}
          </OnboardingLayer>
        )}

        {isEditingProfile && <ProfileSheet initial={preferences} onSave={saveProfile} onDismiss={closeSheet} />}

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
  onExample,
  onFile,
  location,
  onLocationChange,
}: {
  isResuming: boolean;
  isRequesting: boolean;
  onOpenCamera: () => void;
  onExample: () => void;
  onFile: (file: File) => void;
  location: string;
  onLocationChange: (value: string) => void;
}): React.JSX.Element {
  // Three rows: above the orb, the orb, below it. The outer rows share the
  // leftover height equally, so the orb sits at the exact middle of the screen.
  // If one side's content needs more than half (a very short phone), that row
  // grows and the orb shifts slightly instead of anything overflowing.
  return (
    <div className="relative grid h-full grid-rows-[1fr_auto_1fr] px-6 text-center">
      {/* Top padding keeps this row's content clear of the floating header. */}
      <section className="self-end px-2 pt-[calc(4.75rem+var(--safe-top))]">
      </section>

      {/* iOS only grants the camera from a user gesture, so we never auto-start. */}
      <CameraOrb
        onPress={onOpenCamera}
        isWaiting={isRequesting}
        label={isResuming ? "Resume camera" : "Open camera"}
      />
      <div className="flex flex-col items-center self-start pb-[calc(5.5rem+var(--safe-bottom))]">
      <h2 className="mt-[clamp(8px,2.5cqh,20px)] font-display text-[clamp(1.25rem,3.4cqh,1.5rem)] font-semibold text-lichen">
        {isRequesting ? "Waiting for the camera…" : isResuming ? "Tap to resume" : "Tap to discover"}
      </h2>
      <p className="mx-auto mt-[clamp(6px,1.5cqh,12px)] max-w-[30ch] [@container(max-height:640px)]:hidden text-[clamp(14px,2cqh,15px)] leading-relaxed text-lichen/80">
          Snap a photo and a fairy will tell you how to recycle it, and how to reuse it.
        </p>

      <div className="mt-[clamp(4px,1.5cqh,16px)] flex flex-col items-center">
        <button
          type="button"
          onClick={onExample}
          aria-label="Try a magical example"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-honey-light"
        >
          <Icon name="sparkle" size={14} className="fill-glimmer text-honey-light" />
        </button>
      </div>

      <div className="mt-6 flex w-full justify-center">
        <LocationField value={location} onChange={onLocationChange} />
      </div>
      </div>
    </div>
  );
}

function PanelBody({
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
    return <ResultCard result={state.result} headingId={headingId} onClose={onScanAgain} />;
  }

  const message = captureError ?? (state.status === "error" ? state.message : null);
  if (!message) return null;
  const canRetry = state.status === "error" && state.canRetry && !captureError;

  return (
    <div className="flex h-full flex-col gap-6">
      <ResultHeading
        headingId={headingId}
        title="That scan didn't make it"
        eyebrow="A twig in the path"
        onClose={onScanAgain}
      />
      <p className="text-[15px] leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-auto flex flex-col gap-3">
        {canRetry && <ScanAgainButton onClick={onRetry} label="Try that photo again" />}
        <ScanAgainButton onClick={onScanAgain} label="Take a new photo" variant={canRetry ? "outline" : "solid"} />
      </div>
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

const noopSubscribe = (): (() => void) => () => undefined;

/** False during server render and hydration, true after, without a setState-in-effect. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
