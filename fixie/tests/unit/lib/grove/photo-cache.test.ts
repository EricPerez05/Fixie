import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPhotos,
  deletePhotos,
  MAX_LOCAL_PHOTOS,
  photosToEvict,
  readPhoto,
  readPhotoBase64,
  resetPhotoCacheForTests,
  savePhoto,
} from "@/lib/grove/photo-cache";

vi.mock("@/lib/log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const JPEG = btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 1, 2, 3));

describe("photosToEvict", () => {
  it("keeps the newest and evicts the rest", () => {
    const records = [
      { id: "old", savedAt: 1 },
      { id: "new", savedAt: 3 },
      { id: "mid", savedAt: 2 },
    ];
    expect(photosToEvict(records, 2)).toEqual(["old"]);
    expect(photosToEvict(records, 5)).toEqual([]);
  });
});

describe("photo cache", () => {
  beforeEach(async () => {
    resetPhotoCacheForTests();
    await clearPhotos();
  });

  it("saves and reads back a photo", async () => {
    expect(await savePhoto("a", JPEG)).toBe(true);
    expect(await readPhotoBase64("a")).toBe(JPEG);
    expect((await readPhoto("a"))?.type).toBe("image/jpeg");
  });

  it("deletes a photo", async () => {
    await savePhoto("a", JPEG);
    await deletePhotos(["a"]);
    expect(await readPhoto("a")).toBeNull();
  });

  it(`keeps only the newest ${MAX_LOCAL_PHOTOS} photos`, async () => {
    const now = vi.spyOn(Date, "now");
    for (let i = 0; i <= MAX_LOCAL_PHOTOS; i++) {
      now.mockReturnValue(1_000 + i);
      await savePhoto(`p${i}`, JPEG);
    }
    now.mockRestore();
    expect(await readPhoto("p0")).toBeNull();
    expect(await readPhoto(`p${MAX_LOCAL_PHOTOS}`)).not.toBeNull();
  });

  it("refuses data that isn't base64", async () => {
    expect(await savePhoto("bad", "%%%")).toBe(false);
  });
});

describe("LocalGroveStore photos", () => {
  beforeEach(async () => {
    resetPhotoCacheForTests();
    await clearPhotos();
    window.localStorage.clear();
  });

  it("saves the photo when logging, serves it as an object URL, and deletes it with the entry", async () => {
    const { createLocalGroveStore } = await import("@/lib/grove/local-store");
    const { DEMO_RESULTS } = await import("@/lib/scan/demo-results");
    const createObjectURL = vi.fn(() => "blob:fixie/1");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));

    const store = createLocalGroveStore();
    const outcome = await store.log({ scannedAt: "2026-10-04T12:00:00.000Z", result: DEMO_RESULTS[0], photo: JPEG });
    if (!outcome.ok) throw new Error("fixture should log");
    expect(outcome.entry.hasPhoto).toBe(true);
    expect(await store.photoUrl(outcome.entry)).toBe("blob:fixie/1");

    await store.remove(outcome.entry.id);
    expect(await readPhoto(outcome.entry.id)).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fixie/1");
    vi.unstubAllGlobals();
  });

  it("logs the branch without a photo when none was taken", async () => {
    const { createLocalGroveStore } = await import("@/lib/grove/local-store");
    const { DEMO_RESULTS } = await import("@/lib/scan/demo-results");
    const outcome = await createLocalGroveStore().log({ scannedAt: "2026-10-04T12:00:00.000Z", result: DEMO_RESULTS[0] });
    expect(outcome.ok && outcome.entry.hasPhoto).toBeFalsy();
  });
});
