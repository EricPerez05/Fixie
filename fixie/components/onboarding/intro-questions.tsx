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

      {/* Bottom padding leaves room to scroll the last chips clear of the pinned Save button. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-[clamp(0.25rem,2cqh,1rem)] pb-[calc(7rem+var(--safe-bottom))]">
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
                className="font-display text-[clamp(1.625rem,3.8cqh,2rem)] leading-[1.08] font-semibold tracking-[-0.01em] text-balance text-honey-light"
              >
                {PROFILE_TITLE}
              </h1>
              <p className="mx-auto mt-3 max-w-[28ch] text-[clamp(15px,2cqh,17px)] leading-[1.6] font-medium text-pretty text-lichen">
                {PROFILE_DESCRIPTION}
              </p>
            </header>
          }
        />
      </div>

      {/* Pinned over the bottom of the form, fading it out, so Save is always in reach. */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-moss-deep from-60% to-transparent px-6 pt-10 pb-[max(clamp(1rem,5.4cqh,2.875rem),var(--safe-bottom))]">
        <PrimaryButton type="submit" form={formId}>
          Save
        </PrimaryButton>
      </div>
    </section>
  );
}
