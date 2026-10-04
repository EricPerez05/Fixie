"use client";

import { useCallback, useState } from "react";

export const INTRO_SLIDE_COUNT = 3;

export type OnboardingView = "intro" | "questions";

export interface UseOnboarding {
  view: OnboardingView;
  /** The intro screen showing, from 0. */
  slide: number;
  /** Moves to an intro screen, clamped to the ones that exist. */
  goToSlide: (index: number) => void;
  /** "Skip" and "Get started" both lead to the profile questions. */
  openQuestions: () => void;
  /** "Back" from the questions returns to the last intro screen. */
  backToIntro: () => void;
}

/** Where a newcomer is in the first-launch intro. Remembering that it's done is `useIntroSeen`'s job. */
export function useOnboarding(): UseOnboarding {
  const [view, setView] = useState<OnboardingView>("intro");
  const [slide, setSlide] = useState(0);

  const goToSlide = useCallback((index: number): void => {
    setSlide(Math.min(Math.max(index, 0), INTRO_SLIDE_COUNT - 1));
  }, []);
  const openQuestions = useCallback((): void => setView("questions"), []);
  const backToIntro = useCallback((): void => {
    setSlide(INTRO_SLIDE_COUNT - 1);
    setView("intro");
  }, []);

  return { view, slide, goToSlide, openQuestions, backToIntro };
}
