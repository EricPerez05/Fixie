"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/icon";

interface UploadButtonProps {
  onFile: (file: File) => void;
  label?: string;
  /** primary: gold pill. link: gold underlined text. icon: round glass button over the camera. */
  variant?: "primary" | "link" | "icon";
}

const STYLES = {
  primary: "min-h-12 rounded-full bg-glimmer px-7 font-semibold text-moss-deep",
  link: "min-h-11 gap-1.5 text-sm font-semibold text-honey-light underline decoration-honey-light/50 underline-offset-4",
  icon: "h-13 w-13 rounded-full border border-lichen/30 bg-moss-night/50 text-lichen backdrop-blur-sm",
} as const;

/**
 * A file input styled as a button. `capture="environment"` opens the rear
 * camera directly on most phones, so this doubles as the no-permission path.
 */
export function UploadButton({
  onFile,
  label = "Upload a photo",
  variant = "link",
}: UploadButtonProps): React.JSX.Element {
  const inputId = useId();

  return (
    <>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="peer sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Clear so choosing the same photo twice still fires onChange.
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <label
        htmlFor={inputId}
        aria-label={variant === "icon" ? label : undefined}
        className={`inline-flex cursor-pointer items-center justify-center peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-glimmer ${STYLES[variant]}`}
      >
        {variant === "icon" ? <Icon name="image" size={24} /> : label}
      </label>
    </>
  );
}
