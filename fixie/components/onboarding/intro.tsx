"use client";

import { useEffect, useRef } from "react";
import { INTRO_SLIDE_COUNT } from "@/hooks/use-onboarding";
import { Wordmark } from "../ui/wordmark";
import { MakeItMagicalArt } from "./make-it-magical-art";
import { PrimaryButton, TextButton } from "./onboarding-buttons";
import { SnapItArt } from "./snap-it-art";

interface IntroProps {
  /** The screen showing, from 0. */
  slide: number;
  onGoToSlide: (index: number) => void;
  /** "Skip" and "Get started": both open the profile questions. */
  onOpenQuestions: () => void;
}

// A swipe needs this much sideways travel, and more sideways than down, so a
// vertical scroll or a sloppy tap never changes the screen.
const SWIPE_MIN_PX = 50;

const ART_CLASS = "h-full max-h-75 w-auto max-w-full";

const SLIDES: { label?: string; title: string; text: string; art: React.ReactNode; isGold?: boolean }[] = [
  {
    title: "Meet your pocket fairy",
    text: "Before something hits the bin, show it to Fixie. We’ll help you give it a second life.",
    art: <Wordmark tone="dark" isDecorative className="h-auto w-[173px]" />,
    isGold: true,
  },
  {
    label: "Step 1",
    title: "Snap it",
    text: "Point your camera at one item. A fairy works out what it is, what it’s made of, and how to recycle it where you live.",
    art: <SnapItArt className={ART_CLASS} />,
  },
  {
    label: "Step 2",
    title: "Make it magical",
    text: "Get easy upcycling projects picked for your space and tools. Risky items like batteries get a safe drop-off plan.",
    art: <MakeItMagicalArt className={ART_CLASS} />,
  },
];

/**
 * The three first-launch screens that explain Fixie, as a carousel: Next,
 * Back, Skip, the dots, a sideways swipe and the arrow keys all move through
 * it. Where it is lives in useOnboarding; this only draws it.
 */
export function Intro({ slide, onGoToSlide, onOpenQuestions }: IntroProps): React.JSX.Element {
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const isLast = slide === INTRO_SLIDE_COUNT - 1;

  // Land keyboard and screen-reader users on the new screen's heading.
  // preventScroll: a plain focus() can scroll the clipped app container.
  useEffect(() => {
    headingRefs.current[slide]?.focus({ preventScroll: true });
  }, [slide]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight") onGoToSlide(slide + 1);
      if (event.key === "ArrowLeft") onGoToSlide(slide - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slide, onGoToSlide]);

  function endSwipe(event: React.PointerEvent): void {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    onGoToSlide(slide + (dx < 0 ? 1 : -1));
  }

  return (
    <section aria-roledescription="carousel" aria-label="About Fixie" className="relative flex h-full flex-col">
      <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-[calc(var(--safe-top)+0.5rem)]">
        <TextButton isBack isHidden={slide === 0} onClick={() => onGoToSlide(slide - 1)}>
          Back
        </TextButton>
        <TextButton isHidden={isLast} onClick={onOpenQuestions}>
          Skip
        </TextButton>
      </div>

      {/* pan-y: the browser keeps vertical scrolling; sideways movement is ours to read as a swipe. */}
      <div
        className="relative min-h-0 flex-1 touch-pan-y"
        onPointerDown={(event) => {
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={endSwipe}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {SLIDES.map((content, index) => (
          <div
            key={content.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${INTRO_SLIDE_COUNT}`}
            inert={index !== slide}
            className={`absolute inset-0 flex flex-col items-center px-7.5 pt-[clamp(0.5rem,2.5cqh,1.25rem)] text-center transition-[opacity,transform] duration-350 ease-out ${
              index === slide
                ? "translate-x-0 opacity-100"
                : index < slide
                  ? "-translate-x-7 opacity-0"
                  : "translate-x-7 opacity-0"
            }`}
          >
            {/* The art gives way first on short screens, so the words always fit. */}
            <div className="flex h-75 min-h-0 w-full shrink items-center justify-center">{content.art}</div>
            {content.label && (
              <p className="mt-[clamp(0.75rem,3cqh,1.625rem)] text-xs font-bold tracking-[0.14em] text-honey-light uppercase">
                {content.label}
              </p>
            )}
            <h1
              ref={(element) => {
                headingRefs.current[index] = element;
              }}
              tabIndex={-1}
              className={`font-display text-[clamp(1.625rem,3.8cqh,2rem)] leading-[1.08] font-semibold tracking-[-0.01em] text-balance ${
                content.label ? "mt-2" : "mt-[clamp(0.75rem,3cqh,1.625rem)]"
              } ${content.isGold ? "text-honey-light" : "text-lichen"}`}
            >
              {content.title}
            </h1>
            <p className="mx-auto mt-3 max-w-[28ch] text-[clamp(15px,2cqh,17px)] leading-[1.6] font-medium text-pretty text-lichen">
              {content.text}
            </p>
          </div>
        ))}
      </div>

      <div className="relative z-10 grid shrink-0 justify-items-center gap-[clamp(0.5rem,2.6cqh,1.375rem)] px-6 pt-3 pb-[max(clamp(1rem,5.4cqh,2.875rem),var(--safe-bottom))]">
        <div className="flex">
          {SLIDES.map((content, index) => (
            <button
              key={content.title}
              type="button"
              onClick={() => onGoToSlide(index)}
              aria-label={`Go to step ${index + 1}`}
              aria-current={index === slide ? "step" : undefined}
              className="grid h-11 min-w-11 place-items-center px-1"
            >
              <span
                className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${
                  index === slide ? "w-6 bg-glimmer" : "w-2 bg-lichen/30"
                }`}
              />
            </button>
          ))}
        </div>
        <PrimaryButton onClick={() => (isLast ? onOpenQuestions() : onGoToSlide(slide + 1))}>
          {isLast ? "Get started" : "Next"}
        </PrimaryButton>
      </div>

      <p aria-live="polite" className="sr-only">
        {`Step ${slide + 1} of ${INTRO_SLIDE_COUNT}`}
      </p>
    </section>
  );
}
