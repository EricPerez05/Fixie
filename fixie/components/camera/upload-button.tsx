"use client";

import { useId } from "react";

interface UploadButtonProps {
  onFile: (file: File) => void;
  label?: string;
  variant?: "primary" | "quiet";
}

/**
 * A file input styled as a button. `capture="environment"` opens the rear
 * camera directly on most phones, so this doubles as the no-permission path.
 */
export function UploadButton({
  onFile,
  label = "Upload a photo instead",
  variant = "quiet",
}: UploadButtonProps): React.JSX.Element {
  const inputId = useId();
  const style =
    variant === "primary"
      ? "bg-glimmer text-moss-deep font-semibold"
      : "text-lichen underline decoration-glimmer decoration-2 underline-offset-4";

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
        className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-base peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-glimmer ${style}`}
      >
        {label}
      </label>
    </>
  );
}
