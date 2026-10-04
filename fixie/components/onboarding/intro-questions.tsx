"use client";

import { useEffect, useId, useRef } from "react";
import type { Preferences } from "@/lib/scan/schema";
import { PROFILE_DESCRIPTION, PROFILE_TITLE, ProfileForm } from "../ui/profile-form";
import { PrimaryButton, TextButton } from "./onboarding-buttons";

interface IntroQuestionsProps {
  onBack: () => void;
  onSave: (preferences: Preferences) => void;
  onSkip: () => void;
}

/**
 * "Tell the fairies about you" as the last step of the first-launch intro:
 * full screen on green, with the options as chips and Save pinned below.
 * The questions themselves come from the shared ProfileForm.
 */
export function IntroQuestions({ onBack, onSave, onSkip }: IntroQuestionsProps): React.JSX.Element {
  const formId = useId();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section aria-labelledby={headingId} className="relative flex h-full flex-col">
      <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pt-[calc(var(--safe-top)+0.5rem)]">
        <TextButton isBack onClick={onBack}>
          Back
        </TextButton>
        <TextButton onClick={onSkip}>Skip for now</TextButton>
      </div>

      {/* Sized to fit without scrolling; overflow is only a fallback for very short screens. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-[clamp(0.25rem,1.5cqh,1rem)]">
        <ProfileForm
          id={formId}
          look="chips"
          initial={null}
          onSave={onSave}
          header={
            <header className="text-center">
              <h1
                id={headingId}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-[clamp(1.5rem,3.6cqh,2rem)] leading-[1.08] font-semibold tracking-[-0.01em] text-balance text-honey-light"
              >
                {PROFILE_TITLE}
              </h1>
              {/* Dropped on short screens, where it would push the questions into a scroll. */}
              <p className="mx-auto mt-3 max-w-[28ch] [@container(max-height:899px)]:hidden text-[clamp(15px,2cqh,17px)] leading-[1.6] font-medium text-pretty text-lichen">
                {PROFILE_DESCRIPTION}
              </p>
            </header>
          }
        />
      </div>

      <div className="shrink-0 px-6 pt-[clamp(0.75rem,2cqh,1rem)] pb-[max(clamp(1rem,4.5cqh,2.875rem),var(--safe-bottom))]">
        <PrimaryButton type="submit" form={formId}>
          Save
        </PrimaryButton>
      </div>
    </section>
  );
}
