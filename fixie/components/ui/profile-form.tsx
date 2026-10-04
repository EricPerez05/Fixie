"use client";

import { useState } from "react";
import { CraftTool, Interest, Space, type Preferences } from "@/lib/scan/schema";
import { EMPTY_PREFERENCES } from "@/hooks/use-preferences";

export const PROFILE_TITLE = "Tell the fairies about you";
export const PROFILE_DESCRIPTION =
  "They’ll pick projects that suit your space and the tools you have. It stays on this device.";

/** "sheet" is the cream edit sheet; "chips" is the green first-launch screen. */
export type ProfileFormLook = "sheet" | "chips";

interface ProfileFormProps {
  /** Lets a submit button outside the form (a pinned footer) save it. */
  id?: string;
  initial: Preferences | null;
  onSave: (preferences: Preferences) => void;
  look: ProfileFormLook;
  className?: string;
  /** Title and description, styled by the caller. */
  header: React.ReactNode;
  /** Buttons that sit inside the form, if any. */
  footer?: React.ReactNode;
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
 * optional and choices only. The one place they're asked, in either look.
 */
export function ProfileForm({
  id,
  initial,
  onSave,
  look,
  className = "",
  header,
  footer,
}: ProfileFormProps): React.JSX.Element {
  const [draft, setDraft] = useState<Preferences>(initial ?? EMPTY_PREFERENCES);

  return (
    <form
      id={id}
      className={`flex flex-col ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      {header}

      <OptionGroup look={look} legend="Where can you make things?">
        {Space.options.map((space) => (
          <Option key={space} look={look} label={SPACE_LABEL[space]}>
            <input
              type="radio"
              name="space"
              checked={draft.space === space}
              onChange={() => setDraft((current) => ({ ...current, space }))}
              className={INPUT_CLASS[look]}
            />
          </Option>
        ))}
      </OptionGroup>

      <OptionGroup look={look} legend="What do you enjoy?" hint="Pick any">
        {Interest.options.map((interest) => (
          <Option key={interest} look={look} label={INTEREST_LABEL[interest]}>
            <input
              type="checkbox"
              checked={draft.interests.includes(interest)}
              onChange={() => setDraft((current) => ({ ...current, interests: toggle(current.interests, interest) }))}
              className={INPUT_CLASS[look]}
            />
          </Option>
        ))}
      </OptionGroup>

      <OptionGroup look={look} legend="What tools do you have?" hint="Pick any">
        {CraftTool.options.map((tool) => (
          <Option key={tool} look={look} label={TOOL_LABEL[tool]}>
            <input
              type="checkbox"
              checked={draft.tools.includes(tool)}
              onChange={() => setDraft((current) => ({ ...current, tools: toggle(current.tools, tool) }))}
              className={INPUT_CLASS[look]}
            />
          </Option>
        ))}
      </OptionGroup>

      {footer}
    </form>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

// The chip look keeps the real input, invisible and covering the whole chip,
// so taps, keyboard and screen readers all work as a normal radio or checkbox.
const INPUT_CLASS: Record<ProfileFormLook, string> = {
  sheet: "h-5 w-5 shrink-0 accent-moss",
  chips: "peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-full focus-visible:outline-none",
};

function OptionGroup({
  look,
  legend,
  hint,
  children,
}: {
  look: ProfileFormLook;
  legend: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  if (look === "chips") {
    return (
      <fieldset className="mt-5.5 min-w-0">
        <legend className="font-display text-[19px] font-semibold">
          {legend} {hint && <span className="ml-1.5 font-sans text-[13px] font-medium text-lichen/70">{hint}</span>}
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
      </fieldset>
    );
  }
  return (
    <fieldset>
      <legend className="font-semibold">
        {legend} {hint && <span className="font-normal text-ink-soft">({hint.toLowerCase()})</span>}
      </legend>
      <div className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** The whole row or chip is the label, so the touch target is at least 44px tall. */
function Option({
  look,
  label,
  children,
}: {
  look: ProfileFormLook;
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  if (look === "chips") {
    return (
      <label className="relative inline-flex cursor-pointer">
        {children}
        <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-lichen/30 bg-moss-night/35 px-4 text-[15px] font-semibold text-lichen transition-colors peer-checked:border-glimmer peer-checked:bg-glimmer peer-checked:text-moss-deep peer-checked:before:font-bold peer-checked:before:content-['✓'] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-glimmer">
          {label}
        </span>
      </label>
    );
  }
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3 text-[15px] has-checked:border-moss has-checked:bg-sage">
      {children}
      <span>{label}</span>
    </label>
  );
}
