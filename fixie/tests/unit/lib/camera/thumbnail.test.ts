import { afterEach, describe, expect, it, vi } from "vitest";
import { makeThumbnail, squareCrop, THUMBNAIL_EDGE_PX } from "@/lib/camera/thumbnail";

describe("squareCrop", () => {
  it("takes the centred square of a landscape photo and caps it at 360px", () => {
    expect(squareCrop(1024, 768, THUMBNAIL_EDGE_PX)).toEqual({ sx: 128, sy: 0, side: 768, edge: 360 });
  });

  it("takes the centred square of a portrait photo", () => {
    expect(squareCrop(576, 1024, THUMBNAIL_EDGE_PX)).toEqual({ sx: 0, sy: 224, side: 576, edge: 360 });
  });

  it("never upscales a small photo", () => {
    expect(squareCrop(200, 300, THUMBNAIL_EDGE_PX)).toEqual({ sx: 0, sy: 50, side: 200, edge: 200 });
  });
});

describe("makeThumbnail", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubImage(width: number, height: number, { fails = false } = {}): void {
    class FakeImage {
      naturalWidth = width;
      naturalHeight = height;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => (fails ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal("Image", FakeImage);
  }

  function stubCanvas(): { drawImage: ReturnType<typeof vi.fn>; canvas: HTMLCanvasElement } {
    const drawImage = vi.fn();
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/jpeg;base64,VEhVTUI=");
    const create = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
      tag === "canvas" ? canvas : create(tag),
    );
    return { drawImage, canvas };
  }

  it("draws a centre-cropped 360px square and returns base64 without the prefix", async () => {
    stubImage(1024, 768);
    const { drawImage, canvas } = stubCanvas();
    expect(await makeThumbnail("QUJD")).toBe("VEhVTUI=");
    expect(canvas.width).toBe(360);
    expect(canvas.height).toBe(360);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 128, 0, 768, 768, 0, 0, 360, 360);
  });

  it("rejects when the photo can't be decoded", async () => {
    stubImage(0, 0, { fails: true });
    stubCanvas();
    await expect(makeThumbnail("QUJD")).rejects.toThrow(/decode/);
  });
});
