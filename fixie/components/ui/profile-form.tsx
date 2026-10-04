"use client";

import { useState } from "react";
import { CraftTool, Interest, Space, type Preferences } from "@/lib/scan/schema";
import { EMPTY_PREFERENCES } from "@/hooks/use-preferences";

export const PROFILE_TITLE = "Tell the fairies about you";
export const PROFILE_DESCRIPTION =
  "They’ll pick projects that suit your space and the tools you have. It stays on this device.";

interface ProfileFormProps {
  /** Lets a submit button outside the form (a pinned footer) save it. */
  id?: string;
  initial: Preferences | null;
  onSave: (preferences: Preferences) => void;
  /** Title and description, styled by the caller. */
  header: React.ReactNode;
}

const SPACE_LABEL: Record<Space, string> = {
  indoors: "Indoors only",
  balcony: "A balcony",
  yard: "A yard",
};

const INTEREST_LABEL: Record<Interest, string> = {
  plants: "Plants",
  organizing: "Organizing",
  decor: "Decor",
  gifts: "Gifts",
  kids: "Making with kids",
};

const TOOL_LABEL: Record<CraftTool, string> = {
  scissors_tape: "Scissors and tape",
  basic_tools: "Hammer and nails",
  glue_paint: "Glue and paint",
  sewing: "Needle and thread",
};

/**
 * The "Tell the fairies about you" questions: space, interests and tools, all
 * optional and choices only, as chips. The one place they're asked.
 */
export function ProfileForm({ id, initial, onSave, header }: ProfileFormProps): React.JSX.Element {
  const [draft, setDraft] = useState<Preferences>(initial ?? EMPTY_PREFERENCES);

  return (
    <form
      id={id}
      className="flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      {header}

      <OptionGroup legend="Where can you make things?">
        {Space.options.map((space) => (
          <Option key={space} label={SPACE_LABEL[space]}>
            <input
              type="radio"
              name="space"
              checked={draft.space === space}
              onChange={() => setDraft((current) => ({ ...current, space }))}
              className={INPUT_CLASS}
            />
          </Option>
        ))}
      </OptionGroup>

      <OptionGroup legend="What do you enjoy?" hint="Pick any">
        {Interest.options.map((interest) => (
          <Option key={interest} label={INTEREST_LABEL[interest]}>
            <input
              type="checkbox"
              checked={draft.interests.includes(interest)}
              onChange={() => setDraft((current) => ({ ...current, interests: toggle(current.interests, interest) }))}
              className={INPUT_CLASS}
            />
          </Option>
        ))}
      </OptionGroup>

      <OptionGroup legend="What tools do you have?" hint="Pick any">
        {CraftTool.options.map((tool) => (
          <Option key={tool} label={TOOL_LABEL[tool]}>
            <input
              type="checkbox"
              checked={draft.tools.includes(tool)}
              onChange={() => setDraft((current) => ({ ...current, tools: toggle(current.tools, tool) }))}
              className={INPUT_CLASS}
            />
          </Option>
        ))}
      </OptionGroup>
    </form>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

// The real input stays, invisible and covering the whole chip, so taps,
// keyboard and screen readers all work as a normal radio or checkbox.
const INPUT_CLASS =
  "peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-full focus-visible:outline-none";

function OptionGroup({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    // Spacing shrinks with the screen's height (cqh), so all three questions
    // fit without scrolling down to short phones and the desktop frame.
    <fieldset className="mt-[clamp(0.625rem,2.4cqh,1.375rem)] min-w-0">
      <legend className="font-display text-[clamp(1rem,2.3cqh,1.1875rem)] font-semibold">
        {legend} {hint && <span className="ml-1.5 font-sans text-[13px] font-medium text-lichen/70">{hint}</span>}
      </legend>
      <div className="mt-[clamp(0.375rem,1.2cqh,0.625rem)] flex flex-wrap gap-[clamp(0.375rem,1cqh,0.5rem)]">{children}</div>
    </fieldset>
  );
}

/** The whole chip is the label, so the touch target is at least 44px tall. */
function Option({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="relative inline-flex cursor-pointer">
      {children}
      <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-lichen/30 bg-moss-night/35 px-[clamp(0.75rem,1.9cqh,1rem)] text-[clamp(14px,1.8cqh,15px)] font-semibold text-lichen transition-colors peer-checked:border-glimmer peer-checked:bg-glimmer peer-checked:text-moss-deep peer-checked:before:font-bold peer-checked:before:content-['✓'] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-glimmer">
        {label}
      </span>
    </label>
  );
}
