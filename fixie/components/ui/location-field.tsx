"use client";

import { useId } from "react";
import { MAX_LOCATION_LENGTH } from "@/hooks/use-location";

interface LocationFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Optional city or ZIP, so the fairy can give local recycling rules.
 * Compact on purpose: the start screen has to fit the orb, its text and the
 * bottom nav without scrolling, so the label and hint are kept for screen
 * readers and the placeholder carries the visible prompt.
 */
export function LocationField({ value, onChange }: LocationFieldProps): React.JSX.Element {
  const inputId = useId();
  const hintId = useId();

  return (
    <div className="w-full max-w-72 text-left">
      <label htmlFor={inputId} className="sr-only">
        Your city or ZIP (optional)
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="text"
        autoComplete="address-level2"
        maxLength={MAX_LOCATION_LENGTH}
        placeholder="Your city or ZIP (optional)"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hintId}
        className="min-h-11 w-full rounded-xl border border-lichen/30 bg-moss-night/40 px-3.5 text-base text-lichen placeholder:text-lichen/50"
      />
      <p id={hintId} className="sr-only">
        Recycling rules vary by city, so this makes the advice local.
      </p>
    </div>
  );
}
