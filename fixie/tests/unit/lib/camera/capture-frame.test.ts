import { afterEach, describe, expect, it, vi } from "vitest";
import { captureFrame, fitWithin, MAX_EDGE_PX } from "@/lib/camera/capture-frame";

describe("fitWithin", () => {
  it("downscales a landscape photo so the long edge is 1024px", () => {
    expect(fitWithin({ width: 4032, height: 3024 }, MAX_EDGE_PX)).toEqual({ width: 1024, height: 768 });
  });

  it("downscales a portrait photo by its height", () => {
    expect(fitWithin({ width: 1080, height: 1920 }, MAX_EDGE_PX)).toEqual({ width: 576, height: 1024 });
  });

  it("never upscales", () => {
    expect(fitWithin({ width: 640, height: 480 }, MAX_EDGE_PX)).toEqual({ width: 640, height: 480 });
  });
});

describe("captureFrame", () => {
  afterEach(() => vi.restoreAllMocks());

  function stubCanvas(): { drawImage: ReturnType<typeof vi.fn>; canvas: HTMLCanvasElement } {
    const drawImage = vi.fn();
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/jpeg;base64,QUJD");
    const create = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
      tag === "canvas" ? canvas : create(tag),
    );
    return { drawImage, canvas };
  }

  it("returns base64 without the data: prefix, at most 1024px", () => {
    const { drawImage, canvas } = stubCanvas();
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 1920 });
    Object.defineProperty(video, "videoHeight", { value: 1080 });

    expect(captureFrame(video)).toBe("QUJD");
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(576);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1024, 576);
  });

  it("throws when the video has no frame yet", () => {
    stubCanvas();
    expect(() => captureFrame(document.createElement("video"))).toThrow(/no frame/);
  });
});
