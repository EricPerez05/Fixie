import type { ReactNode } from "react";

export type IconName =
  | "camera"
  | "image"
  | "sparkle"
  | "check"
  | "arrow"
  | "wand"
  | "close"
  | "alert"
  | "forest"
  | "home"
  | "plus";

const PATHS: Record<IconName, ReactNode> = {
  camera: (
    <>
      <path d="M9 5.5 10.2 3h3.6L15 5.5h2.5A2.5 2.5 0 0 1 20 8v8.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5V8a2.5 2.5 0 0 1 2.5-2.5H9Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
    </>
  ),
  sparkle: <path d="M12 2c.7 5.5 4.5 9.3 10 10-5.5.7-9.3 4.5-10 10-.7-5.5-4.5-9.3-10-10 5.5-.7 9.3-4.5 10-10Z" />,
  check: <path d="m5 12.5 4.2 4L19 6.8" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  wand: (
    <>
      <path d="m5 19 10.5-10.5" />
      <path d="m14 4 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM5 10l.6-1.4L7 8l-1.4-.6L5 6l-.6 1.4L3 8l1.4.6L5 10Zm14 6 .8-1.8L22 13l-2.2-.8L19 10l-.8 2.2L16 13l2.2 1.2L19 16Z" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  forest: (
    <>
      <path d="m8 3-5 8h3l-4 7h8" />
      <path d="m16 2-5 9h3l-5 8h14l-5-8h3l-5-9Z" />
      <path d="M16 19v3M7 18v3" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10v9.5h11V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  alert: (
    <>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Line icons from the mockup. Decorative: always pair with a visible or aria label. */
export function Icon({ name, size = 24, className = "" }: IconProps): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`block shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
