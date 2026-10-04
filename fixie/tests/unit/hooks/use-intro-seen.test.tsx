import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIntroSeen } from "@/hooks/use-intro-seen";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useIntroSeen", () => {
  it("starts false", () => {
    const { result } = renderHook(() => useIntroSeen());
    expect(result.current.hasSeenIntro).toBe(false);
  });

  it("remembers true on this device", () => {
    const first = renderHook(() => useIntroSeen());
    act(() => first.result.current.markIntroSeen());
    expect(first.result.current.hasSeenIntro).toBe(true);
    expect(window.localStorage.getItem("fixie.introSeen")).toBe("true");

    // A later visit reads it back.
    first.unmount();
    const later = renderHook(() => useIntroSeen());
    expect(later.result.current.hasSeenIntro).toBe(true);
  });

  // Last on purpose: the in-memory fallback it sets lasts for the module's life.
  it("survives blocked storage for the rest of the visit", () => {
    const blocked = (): never => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);

    const { result } = renderHook(() => useIntroSeen());
    expect(result.current.hasSeenIntro).toBe(false);
    expect(() => act(() => result.current.markIntroSeen())).not.toThrow();
    expect(result.current.hasSeenIntro).toBe(true);
  });
});
