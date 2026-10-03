// 1024px is enough for the model to read labels, and keeps the upload
// under ~200KB on venue Wi-Fi. Full-resolution photos are 3–5MB.
export const MAX_EDGE_PX = 1024;
export const JPEG_QUALITY = 0.8;

export type FrameSource = HTMLVideoElement | HTMLImageElement | ImageBitmap;

export interface CaptureOptions {
  maxEdgePx?: number;
  quality?: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Scales a size down so its longest edge is at most `maxEdge`, keeping the
 * aspect ratio. Never scales up. Returns integer pixel sizes of at least 1.
 */
export function fitWithin(size: Size, maxEdge: number): Size {
  const longest = Math.max(size.width, size.height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

function sourceSize(source: FrameSource): Size {
  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

/**
 * Draws the current frame of a video (or an uploaded image) to a canvas,
 * downscales it and returns the JPEG as base64 with no `data:` prefix,
 * which is what POST /api/scan expects.
 *
 * Throws if the source has no pixels yet (a video before its first frame)
 * or the browser can't give us a 2D context. Callers treat both as
 * "try again", not as a crash.
 */
export function captureFrame(source: FrameSource, options: CaptureOptions = {}): string {
  const { maxEdgePx = MAX_EDGE_PX, quality = JPEG_QUALITY } = options;
  const natural = sourceSize(source);
  if (natural.width === 0 || natural.height === 0) {
    throw new Error("captureFrame: source has no frame yet");
  }

  const target = fitWithin(natural, maxEdgePx);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("captureFrame: 2D canvas context unavailable");
  }
  context.drawImage(source, 0, 0, target.width, target.height);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
