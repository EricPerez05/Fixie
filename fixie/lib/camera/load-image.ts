/**
 * Decodes an uploaded image file into an <img> that captureFrame() can draw.
 * Modern browsers apply the photo's EXIF orientation when drawing an <img>,
 * which createImageBitmap does not do consistently on older iOS.
 *
 * Rejects if the file isn't a decodable image.
 */
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("loadImageFile: could not decode image"));
    };
    image.src = url;
  });
}
