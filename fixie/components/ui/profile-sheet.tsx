"use client";

import { useEffect, useId, useRef } from "react";
import type { Preferences } from "@/lib/scan/schema";
import { Icon } from "./icon";
import { PROFILE_DESCRIPTION, PROFILE_TITLE, ProfileForm } from "./profile-form";

interface ProfileSheetProps {
  initial: Preferences | null;
  onSave: (preferences: Preferences) => void;
  onDismiss: () => void;
}

/**
 * Editing "Tell the fairies about you" later, from the wand button. A modal
 * sheet; the caller makes the screen behind it inert.
 */
export function ProfileSheet({ initial, onSave, onDismiss }: ProfileSheetProps): React.JSX.Element {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-moss-night/60">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-h-[92%] w-full overflow-y-auto rounded-t-3xl bg-cream px-5 pt-6 pb-[max(1.5rem,var(--safe-bottom))] text-ink"
      >
        <ProfileForm
          look="sheet"
          initial={initial}
          onSave={onSave}
          className="mx-auto max-w-md gap-5"
          header={
            <header>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-honey uppercase">
                <Icon name="sparkle" size={14} className="fill-current" />
                Optional
              </p>
              <h2 id={headingId} ref={headingRef} tabIndex={-1} className="mt-1 font-display text-2xl font-semibold">
                {PROFILE_TITLE}
              </h2>
              <p className="mt-1 text-[15px] text-ink-soft">{PROFILE_DESCRIPTION}</p>
            </header>
          }
          footer={
            <div className="flex flex-col gap-2">
              <button type="submit" className="min-h-12 rounded-full bg-moss px-5 font-bold text-lichen">
                Save
              </button>
              <button type="button" onClick={onDismiss} className="min-h-11 rounded-full px-5 font-semibold text-moss">
                Cancel
              </button>
            </div>
          }
        />
      </section>
    </div>
  );
}
