// Polaroids on the Grove draw at about 48px, so 360px is sharp on a 3x
// screen and keeps each stored photo around 15–40KB.
export const THUMBNAIL_EDGE_PX = 360;
export const THUMBNAIL_QUALITY = 0.75;

export interface ThumbnailOptions {
  maxEdgePx?: number;
  quality?: number;
}

export interface SquareCrop {
  /** Source rectangle: the largest centred square. */
  sx: number;
  sy: number;
  side: number;
  /** Output edge in px: the square's side, capped at maxEdge. Never upscaled. */
  edge: number;
}

/**
 * The largest centred square inside `width` × `height`, and the edge to draw
 * it at so it is at most `maxEdge` px. Pure; never throws.
 */
export function squareCrop(width: number, height: number, maxEdge: number): SquareCrop {
  const side = Math.max(1, Math.min(width, height));
  return {
    sx: Math.max(0, Math.floor((width - side) / 2)),
    sy: Math.max(0, Math.floor((height - side) / 2)),
    side,
    edge: Math.max(1, Math.min(side, Math.round(maxEdge))),
  };
}

function decode(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("makeThumbnail: could not decode image"));
    image.src = `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Turns a captured frame (base64 JPEG, no data: prefix) into a small square
 * thumbnail for the Grove, centre-cropped, as base64 JPEG with no prefix.
 *
 * Rejects if the image can't be decoded or the browser can't give us a 2D
 * context. Callers treat that as "log without a photo", never as a crash.
 */
export async function makeThumbnail(base64: string, options: ThumbnailOptions = {}): Promise<string> {
  const { maxEdgePx = THUMBNAIL_EDGE_PX, quality = THUMBNAIL_QUALITY } = options;
  const image = await decode(base64);
  if (image.naturalWidth === 0 || image.naturalHeight === 0) {
    throw new Error("makeThumbnail: image has no pixels");
  }
  const crop = squareCrop(image.naturalWidth, image.naturalHeight, maxEdgePx);
  const canvas = document.createElement("canvas");
  canvas.width = crop.edge;
  canvas.height = crop.edge;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("makeThumbnail: 2D canvas context unavailable");
  context.drawImage(image, crop.sx, crop.sy, crop.side, crop.side, 0, 0, crop.edge, crop.edge);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
