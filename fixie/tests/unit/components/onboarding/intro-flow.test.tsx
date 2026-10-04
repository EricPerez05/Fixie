import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScanScreen } from "@/components/scan-screen";
import { EMPTY_PREFERENCES } from "@/lib/scan/schema";

const PREFERENCES_KEY = "fixie.preferences";
const INTRO_KEY = "fixie.introSeen";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

/** The intro screen showing, read from the dot marked aria-current="step". */
function currentStep(): string {
  return screen.getByRole("button", { current: "step" }).getAttribute("aria-label") ?? "";
}

function click(name: string | RegExp): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

function storedPreferences(): unknown {
  const raw = window.localStorage.getItem(PREFERENCES_KEY);
  return raw === null ? null : JSON.parse(raw);
}

function isWelcomeReachable(): boolean {
  return screen.getByRole("button", { name: "Open camera" }).closest("[inert]") === null;
}

describe("first-launch intro", () => {
  it("shows screen 1 to someone new, over an inert welcome screen", () => {
    render(<ScanScreen isDemo={false} />);
    expect(currentStep()).toBe("Go to step 1");
    expect(document.activeElement).toHaveTextContent("Meet your pocket fairy");
    expect(screen.getByRole("group", { name: "1 of 3" })).not.toHaveAttribute("inert");
    expect(screen.getByRole("group", { name: "2 of 3" })).toHaveAttribute("inert");
    expect(isWelcomeReachable()).toBe(false);
    // No "Back" yet on the first screen.
    expect(screen.queryByRole("button", { name: "Back" })).toHaveClass("invisible");
  });

  it("moves with Next, Back and the dots, and announces each step", () => {
    render(<ScanScreen isDemo={false} />);
    click("Next");
    expect(currentStep()).toBe("Go to step 2");
    expect(document.activeElement).toHaveTextContent("Snap it");
    expect(screen.getByText("Step 2 of 3")).toHaveAttribute("aria-live", "polite");

    click("Back");
    expect(currentStep()).toBe("Go to step 1");

    click("Go to step 3");
    expect(currentStep()).toBe("Go to step 3");
    expect(document.activeElement).toHaveTextContent("Make it magical");
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toHaveClass("invisible");
  });

  it("moves with the arrow keys and a sideways swipe, but not a short or vertical one", () => {
    render(<ScanScreen isDemo={false} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(currentStep()).toBe("Go to step 2");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(currentStep()).toBe("Go to step 1");

    const swipe = (fromX: number, toX: number, toY = 300): void => {
      const slide = screen.getByRole("group", { name: currentStep().replace("Go to step ", "") + " of 3" });
      fireEvent.pointerDown(slide, { clientX: fromX, clientY: 300 });
      fireEvent.pointerUp(slide, { clientX: toX, clientY: toY });
    };
    swipe(300, 240); // 60px left
    expect(currentStep()).toBe("Go to step 2");
    swipe(300, 270); // only 30px
    expect(currentStep()).toBe("Go to step 2");
    swipe(300, 240, 420); // mostly down: a scroll, not a swipe
    expect(currentStep()).toBe("Go to step 2");
    swipe(100, 180); // 80px right
    expect(currentStep()).toBe("Go to step 1");
  });

  it("Skip goes to the questions, not past them", () => {
    render(<ScanScreen isDemo={false} />);
    click("Skip");
    expect(screen.getByRole("heading", { name: "Tell the fairies about you" })).toHaveFocus();
    expect(storedPreferences()).toBeNull();
    expect(window.localStorage.getItem(INTRO_KEY)).toBeNull();
  });

  it("Get started opens the questions, and Back returns to screen 3", () => {
    render(<ScanScreen isDemo={false} />);
    click("Go to step 3");
    click("Get started");
    expect(screen.getByRole("heading", { name: "Tell the fairies about you" })).toBeInTheDocument();

    click("Back");
    expect(currentStep()).toBe("Go to step 3");
    expect(document.activeElement).toHaveTextContent("Make it magical");
  });

  it("Save stores the answers and shows the welcome screen", () => {
    render(<ScanScreen isDemo={false} />);
    click("Skip");
    fireEvent.click(screen.getByRole("radio", { name: "A yard" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Plants" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Glue and paint" }));
    click("Save");

    expect(storedPreferences()).toEqual({ space: "yard", interests: ["plants"], tools: ["glue_paint"] });
    expect(window.localStorage.getItem(INTRO_KEY)).toBe("true");
    expect(screen.queryByRole("region", { name: "About Fixie" })).not.toBeInTheDocument();
    expect(screen.getByText("Tap to discover")).toBeInTheDocument();
    expect(isWelcomeReachable()).toBe(true);
  });

  it("Skip for now stores an empty profile and shows the welcome screen", () => {
    render(<ScanScreen isDemo={false} />);
    click("Skip");
    fireEvent.click(screen.getByRole("checkbox", { name: "Plants" }));
    click("Skip for now");

    expect(storedPreferences()).toEqual(EMPTY_PREFERENCES);
    expect(window.localStorage.getItem(INTRO_KEY)).toBe("true");
    expect(screen.queryByRole("heading", { name: "Tell the fairies about you" })).not.toBeInTheDocument();
    expect(isWelcomeReachable()).toBe(true);
  });

  it("never shows to someone who already has saved preferences", () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(EMPTY_PREFERENCES));
    render(<ScanScreen isDemo={false} />);
    expect(screen.queryByRole("region", { name: "About Fixie" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(isWelcomeReachable()).toBe(true);
  });

  it("never shows in demo mode", () => {
    render(<ScanScreen isDemo />);
    expect(screen.queryByRole("region", { name: "About Fixie" })).not.toBeInTheDocument();
    expect(isWelcomeReachable()).toBe(true);
  });
});

describe("the wand button", () => {
  const saved = { space: "balcony", interests: ["plants"], tools: [] };

  function openWand(): void {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(saved));
    render(<ScanScreen isDemo={false} />);
    click("Your fairy profile");
  }

  it("opens the green questions with the saved answers ticked, and no Skip", () => {
    openWand();
    expect(screen.getByRole("heading", { name: "Tell the fairies about you" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "A balcony" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Plants" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Decor" })).not.toBeChecked();
    expect(screen.queryByRole("button", { name: "Skip for now" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(isWelcomeReachable()).toBe(false);
  });

  it("Back and Escape close it without saving", () => {
    openWand();
    fireEvent.click(screen.getByRole("checkbox", { name: "Decor" }));
    click("Back");
    expect(screen.queryByRole("heading", { name: "Tell the fairies about you" })).not.toBeInTheDocument();
    expect(storedPreferences()).toEqual(saved);
    expect(isWelcomeReachable()).toBe(true);

    click("Your fairy profile");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Tell the fairies about you" })).not.toBeInTheDocument();
  });

  it("Save updates the answers", () => {
    openWand();
    fireEvent.click(screen.getByRole("radio", { name: "A yard" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Needle and thread" }));
    click("Save");
    expect(storedPreferences()).toEqual({ space: "yard", interests: ["plants"], tools: ["sewing"] });
    expect(isWelcomeReachable()).toBe(true);
  });
});

describe("the Home tab", () => {
  it("opens the account screen, and its answers edit and save through the green questions", () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(EMPTY_PREFERENCES));
    render(<ScanScreen isDemo={false} />);
    click("Home");
    expect(screen.getByRole("heading", { name: "Your answers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");

    click("Answer the questions");
    fireEvent.click(screen.getByRole("radio", { name: "A yard" }));
    click("Save");
    expect(storedPreferences()).toEqual({ space: "yard", interests: [], tools: [] });
    // Back on Home, with the new answer shown.
    expect(screen.getByText("A yard")).toBeInTheDocument();
  });

  it("starts on Home when coming back from Google sign-in", () => {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(EMPTY_PREFERENCES));
    render(<ScanScreen isDemo={false} initialTab="account" />);
    expect(screen.getByRole("heading", { name: "Your answers" })).toBeInTheDocument();
  });
});
