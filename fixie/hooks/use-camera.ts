"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { log } from "@/lib/log";

/**
 * idle        never started (iOS needs a user tap before the first start)
 * requesting  waiting on the permission prompt
 * active      preview is live
 * paused      we stopped it because the tab was hidden
 * denied      the user or browser said no
 * unavailable no camera, insecure context (plain HTTP), or the camera is busy
 */
export type CameraStatus = "idle" | "requesting" | "active" | "paused" | "denied" | "unavailable";

export interface UseCamera {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  start: () => Promise<void>;
  stop: () => void;
}

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  // Many phones open the selfie camera unless we ask for the rear one.
  // `ideal` rather than `exact` so laptops with one webcam still work.
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
};

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Owns the camera stream lifecycle. Tracks are always stopped on unmount and
 * whenever the tab is hidden: a camera light left on is a bug.
 */
export function useCamera(): UseCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Bumped on every start/stop so a permission prompt that resolves after the
  // user has moved on doesn't resurrect a stream nobody is showing.
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const release = useCallback((): void => {
    requestIdRef.current += 1;
    stopTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback((): void => {
    release();
    setStatus("idle");
  }, [release]);

  const start = useCallback(async (): Promise<void> => {
    // mediaDevices is undefined on plain HTTP, which is the most common way
    // this fails during phone testing.
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    release();
    const requestId = requestIdRef.current;
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
      if (requestId !== requestIdRef.current) {
        stopTracks(stream);
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // play() rejects if interrupted by a quick stop; autoPlay covers us.
        await video.play().catch(() => undefined);
      }
      setStatus("active");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const name = error instanceof DOMException ? error.name : "Unknown";
      log.warn("camera.start_failed", { reason: name });
      setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  }, [release]);

  useEffect(() => {
    function onVisibilityChange(): void {
      if (document.hidden && streamRef.current) {
        release();
        setStatus("paused");
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      release();
    };
  }, [release]);

  return { videoRef, status, start, stop };
}
