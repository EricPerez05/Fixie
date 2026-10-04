"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "framer-motion";
import { useAccount } from "@/hooks/use-account";
import { useCamera } from "@/hooks/use-camera";
import { useGrove, useGrovePhotos } from "@/hooks/use-grove";
import { useIntroSeen } from "@/hooks/use-intro-seen";
import { useLocation } from "@/hooks/use-location";
import { useOnboarding } from "@/hooks/use-onboarding";
import { usePreferences } from "@/hooks/use-preferences";
import { useRecentResult } from "@/hooks/use-recent-result";
import { useScan, type ScanState } from "@/hooks/use-scan";
import { EMPTY_PREFERENCES, type Preferences } from "@/lib/scan/schema";
import { captureFrame } from "@/lib/camera/capture-frame";
import { loadImageFile } from "@/lib/camera/load-image";
import { makeThumbnail } from "@/lib/camera/thumbnail";
import type { GroveEntry, LogFailure } from "@/lib/grove/entries";
import { newId } from "@/lib/id";
import { log } from "@/lib/log";
import { canLog, isReopenable, type RecentResult, type ResultSource } from "@/lib/scan/recent";
import type { ScanResult } from "@/lib/scan/schema";
import { AccountScreen } from "./account/account-screen";
import { CameraOrb } from "./camera/camera-orb";
import { CameraView } from "./camera/camera-view";
import { PermissionFallback } from "./camera/permission-fallback";
import { GroveScreen } from "./grove/grove-screen";
import type { LogControl, RemoveControl, RemoveStatus } from "./result/log-to-grove";
import { RecentChip } from "./result/recent-chip";
import { Intro } from "./onboarding/intro";
import { OnboardingLayer } from "./onboarding/onboarding-layer";
import { ProfileQuestions } from "./onboarding/profile-questions";
import { ScanButton } from "./camera/scan-button";
import { UploadButton } from "./camera/upload-button";
import { ResultCard, ResultHeading, ScanAgainButton } from "./result/result-card";
import { BottomNav, type NavTab } from "./ui/bottom-nav";
import { Icon } from "./ui/icon";
import { InspectingOverlay } from "./ui/inspecting-overlay";
import { LocationField } from "./ui/location-field";
import { Notice } from "./ui/notice";
import { Panel } from "./ui/panel";
import { PetalShower } from "./ui/petal-shower";
import { TopBar } from "./ui/top-bar";

type LogState = { id: string; status: "logging" } | { id: string; status: "error"; reason: LogFailure };

const LOG_MESSAGES: Record<LogFailure, string> = {
  not_growable: "Only items the fairies recognised can grow a branch.",
  rate_limited: "The Grove needs a breather. Wait a minute, then try again.",
  network: "Couldn't reach your Grove. Check your connection and try again.",
  server: "Your Grove couldn't save that one. Try again.",
};

interface ScanScreenProps {
  isDemo: boolean;
  /** Set when Google sign-in came back with an error, so we can say so once. */
  hasSignInFailed?: boolean;
  /** Set when that Google account already belongs to another Fixie user. */
  isGoogleAccountTaken?: boolean;
  /** "account" when returning from Google sign-in, which starts on the Home tab. */
  initialTab?: NavTab;
}

/** Composes camera, scan and result. All data access lives in the hooks. */
export function ScanScreen({
  isDemo,
  hasSignInFailed = false,
  isGoogleAccountTaken = false,
  initialTab = "start",
}: ScanScreenProps): React.JSX.Element {
  const camera = useCamera();
  const { location, setLocation } = useLocation();
  const { preferences, setPreferences } = usePreferences();
  // Saving goes through the account: always to this device, and to the account when signed in.
  const account = useAccount({ preferences, setPreferences, hasSignInFailed, isGoogleAccountTaken });
  const { savePreferences } = account;
  const grove = useGrove();
  const [tab, setTab] = useState<NavTab>(initialTab);
  const grovePhotos = useGrovePhotos(grove.entries, tab === "grove");
  const { recent, setRecent, markLogged, forgetEntry } = useRecentResult();
  // The result in the open card, with where it came from. Separate from
  // `recent`: reopening a Grove branch shows a result without replacing it.
  const [shown, setShown] = useState<RecentResult | null>(null);

  const [logState, setLogState] = useState<LogState | null>(null);
  const [removeState, setRemoveState] = useState<{ entryId: string; status: Exclude<RemoveStatus, "idle"> } | null>(
    null,
  );
  // The latest scan's thumbnail, for its polaroid. Memory only: it is stored
  // nowhere until the user taps Log, and the next scan replaces it.
  const [thumbnail, setThumbnail] = useState<{ id: string; base64: string } | null>(null);

  // Scanning alone never plants a branch: the user logs it from the card.
  const onScanned = useCallback(
    (result: ScanResult, image: string): void => {
      // A new scan always replaces the recent result, even an unsure one.
      const next = isReopenable(result) ? newRecent(result, "scan") : null;
      setRecent(next);
      setShown(next);
      setThumbnail(null);
      if (next && canLog(next)) {
        makeThumbnail(image)
          .then((base64) => setThumbnail({ id: next.id, base64 }))
          .catch((error: unknown) => {
            // The entry can still be logged; its branch just keeps the fruit.
            log.warn("thumbnail.failed", { reason: error instanceof Error ? error.message : "Unknown" });
          });
      }
    },
    [setRecent],
  );
  const scanner = useScan({ isDemo, location, preferences, onScanned });
  const isClient = useIsClient();
  const { hasSeenIntro, markIntroSeen } = useIntroSeen();
  const onboarding = useOnboarding();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const panelHeadingId = useId();
  const [captureError, setCaptureError] = useState<string | null>(null);

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
      savePreferences(value);
      markIntroSeen();
    },
    [savePreferences, markIntroSeen],
  );

  const stopEditingProfile = useCallback((): void => setIsEditingProfile(false), []);
  const saveProfile = useCallback(
    (value: Preferences): void => {
      savePreferences(value);
      setIsEditingProfile(false);
    },
    [savePreferences],
  );
  const editProfile = (): void => setIsEditingProfile(true);

  // Coming back from Google lands on ?view=account; drop it so a reload starts as usual.
  useEffect(() => {
    if (initialTab === "start") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    window.history.replaceState(null, "", url);
  }, [initialTab]);

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

  function showExample(): void {
    const next = newRecent(scanner.showExample(), "example");
    setRecent(next);
    setShown(next);
  }

  function openEntry(entry: GroveEntry): void {
    scanner.show(entry.result);
    setShown({ id: entry.id, result: entry.result, source: "grove", scannedAt: entry.scannedAt, entryId: entry.id });
  }

  function reopenRecent(): void {
    if (!recent) return;
    scanner.show(recent.result);
    setShown(recent);
  }

  async function logShown(): Promise<void> {
    const target = shown;
    // Clicks are discrete events, so React has re-rendered (and disabled the
    // button) before a second tap can land; this check covers any other caller.
    if (!target || !canLog(target) || (logState?.id === target.id && logState.status === "logging")) return;
    setLogState({ id: target.id, status: "logging" });
    const photo = thumbnail?.id === target.id ? thumbnail.base64 : undefined;
    const outcome = await grove.log({ scannedAt: target.scannedAt, result: target.result, photo });
    if (outcome.ok) {
      setLogState(null);
      // The card may have closed or moved on while saving; only update the copy it was for.
      setShown((current) => (current?.id === target.id ? { ...current, entryId: outcome.entry.id } : current));
      markLogged(target.id, outcome.entry.id);
    } else {
      log.warn("grove.log_failed", { reason: outcome.reason });
      setLogState({ id: target.id, status: "error", reason: outcome.reason });
    }
  }

  async function removeShown(): Promise<void> {
    const target = shown;
    const entryId = target?.entryId;
    if (!target || !entryId || removeState?.status === "removing") return;
    setRemoveState({ entryId, status: "removing" });
    const isRemoved = await grove.remove(entryId);
    if (!isRemoved) {
      log.warn("grove.remove_failed");
      setRemoveState({ entryId, status: "error" });
      return;
    }
    setRemoveState(null);
    forgetEntry(entryId);
    // A branch opened from the Grove has nothing left to show; a fresh scan
    // goes back to "Log to Grove" (with its photo, if still in memory).
    if (target.source === "grove") scanAgain();
    else setShown((current) => (current?.entryId === entryId ? { ...current, entryId: null } : current));
  }

  function removalFor(entryId: string): RemoveControl {
    return {
      status: removeState?.entryId === entryId ? removeState.status : "idle",
      onAsk: () => setRemoveState({ entryId, status: "confirming" }),
      onConfirm: () => void removeShown(),
      onCancel: () => setRemoveState(null),
    };
  }

  function viewGrove(): void {
    scanAgain();
    camera.stop();
    setTab("grove");
  }

  function logControlFor(current: RecentResult | null): LogControl | undefined {
    if (!current) return undefined;
    const base = { hasPhoto: thumbnail?.id === current.id, onLog: () => void logShown(), onViewGrove: viewGrove };
    if (current.entryId !== null) return { ...base, status: "logged", removal: removalFor(current.entryId) };
    // SAFETY: examples and unidentified results never get a Log button.
    if (!canLog(current)) return undefined;
    if (logState?.id !== current.id) return { ...base, status: "idle" };
    return logState.status === "logging"
      ? { ...base, status: "logging" }
      : { ...base, status: "error", errorMessage: LOG_MESSAGES[logState.reason] };
  }

  // Every close route (swipe, backdrop, Escape, the buttons) lands here. It
  // clears the card but keeps `recent`, so Home can offer to reopen it.
  function scanAgain(): void {
    setCaptureError(null);
    setRemoveState(null);
    scanner.reset();
    void camera.videoRef.current?.play().catch(() => undefined);
  }

  function goHome(): void {
    scanAgain();
    camera.stop();
    setTab("start");
  }

  // The camera and its permission fallback belong to the start screen, so leave
  // the Grove or Home first; otherwise a denied camera would show nothing there.
  function openCamera(): void {
    setTab("start");
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
        {/* "contents" keeps the layout as is; inert keeps focus inside the intro or the open questions. */}
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
          tab === "start" && (camera.status === "denied" || camera.status === "unavailable") ? (
            <div className="flex h-full flex-col">
              <TopBar tone="dark" isDemo={isDemo} onEditProfile={editProfile} />
              <div className="flex min-h-0 flex-1 flex-col justify-[safe_center] px-6 pb-[calc(5.5rem+var(--safe-bottom))]">
                <PermissionFallback reason={camera.status} onFile={onFile} onRetry={() => void camera.start()} />
              </div>
              <BottomNav
                active="start"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onAccount={() => setTab("account")}
                isScanBusy={false}
              />
            </div>
          ) : tab === "grove" ? (
            <div className="relative h-full">
              <GroveScreen
                entries={grove.entries}
                onOpenEntry={openEntry}
                onScan={openCamera}
                // Plant branches without scanning while building the Grove. The
                // condition is inlined at build time, so production never ships it.
                devTools={process.env.NODE_ENV === "development" ? grove.devTools : undefined}
                status={grove.status}
                isRemote={grove.isRemote}
                onRetry={grove.refresh}
                photos={grovePhotos.urls}
                onPhotoError={grovePhotos.onPhotoError}
              />
              <BottomNav
                active="grove"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onAccount={() => setTab("account")}
                isScanBusy={camera.status === "requesting"}
              />
            </div>
          ) : tab === "account" ? (
            <div className="relative h-full">
              <AccountScreen
                account={account.account}
                preferences={preferences}
                onSignIn={() => void account.signIn()}
                onSignOut={() => void account.signOut()}
                onEditAnswers={editProfile}
              />
              <BottomNav
                active="account"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onAccount={() => setTab("account")}
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
                onExample={showExample}
                recent={recent}
                onReopen={reopenRecent}
                onFile={onFile}
                location={location}
                onLocationChange={setLocation}
              />
              <BottomNav
                active="start"
                onScan={openCamera}
                onGrove={() => setTab("grove")}
                onAccount={() => setTab("account")}
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
            logControl={logControlFor(shown)}
          />
        </Panel>
        </div>

        {isIntroShowing && (
          <OnboardingLayer>
            {onboarding.view === "intro" ? (
              <Intro slide={onboarding.slide} onGoToSlide={onboarding.goToSlide} onOpenQuestions={onboarding.openQuestions} />
            ) : (
              <ProfileQuestions
                initial={null}
                onBack={onboarding.backToIntro}
                onSave={finishIntro}
                onSkip={() => finishIntro(EMPTY_PREFERENCES)}
              />
            )}
          </OnboardingLayer>
        )}

        {/* The wand button: the same green questions, starting from the saved answers. */}
        {isEditingProfile && (
          <OnboardingLayer>
            <ProfileQuestions initial={preferences} onBack={stopEditingProfile} onSave={saveProfile} />
          </OnboardingLayer>
        )}

        {account.notice && <Notice message={account.notice} onDismiss={account.dismissNotice} />}

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
  recent,
  onReopen,
}: {
  isResuming: boolean;
  isRequesting: boolean;
  onOpenCamera: () => void;
  onExample: () => void;
  onFile: (file: File) => void;
  location: string;
  onLocationChange: (value: string) => void;
  recent: RecentResult | null;
  onReopen: () => void;
}): React.JSX.Element {
  // Three rows: above the orb, the orb, below it. The outer rows share the
  // leftover height equally, so the orb sits at the exact middle of the screen.
  // If one side's content needs more than half (a very short phone), that row
  // grows and the orb shifts slightly instead of anything overflowing.
  return (
    <div className="relative grid h-full grid-rows-[1fr_auto_1fr] px-6 text-center">
      {/* Top padding keeps this row's content clear of the floating header. */}
      <section className="flex min-w-0 justify-center self-end px-2 pt-[calc(4.75rem+var(--safe-top))] pb-[clamp(8px,2.5cqh,24px)]">
        {recent && <RecentChip recent={recent} onReopen={onReopen} />}
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

function newRecent(result: ScanResult, source: ResultSource): RecentResult {
  return { id: newId(), result, source, scannedAt: new Date().toISOString(), entryId: null };
}

function PanelBody({
  state,
  captureError,
  headingId,
  onScanAgain,
  onRetry,
  logControl,
}: {
  state: ScanState;
  captureError: string | null;
  headingId: string;
  onScanAgain: () => void;
  onRetry: () => void;
  logControl: LogControl | undefined;
}): React.JSX.Element | null {
  if (state.status === "success") {
    return <ResultCard result={state.result} headingId={headingId} onClose={onScanAgain} logControl={logControl} />;
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
