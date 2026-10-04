import { Icon } from "../ui/icon";

/** The quiet text buttons along the top of the intro: "Back", "Skip", "Skip for now". */
export function TextButton({
  onClick,
  isBack = false,
  isHidden = false,
  children,
}: {
  onClick: () => void;
  /** Leads with a left arrow. */
  isBack?: boolean;
  /** Keeps its place in the row but can't be seen, focused or read out. */
  isHidden?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-[15px] font-semibold text-lichen/80 hover:text-lichen ${isHidden ? "invisible" : ""}`}
    >
      {isBack && <Icon name="back" size={18} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/** The gold, full-width pill that moves the intro forward. */
export function PrimaryButton({
  onClick,
  type = "button",
  form,
  children,
}: {
  onClick?: () => void;
  type?: "button" | "submit";
  /** Submits this form from outside it, for a footer pinned below a scrolling form. */
  form?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-glimmer px-6 text-[17px] font-bold text-moss-deep shadow-[0_9px_24px_color-mix(in_srgb,var(--moss-night)_45%,transparent),0_0_30px_color-mix(in_srgb,var(--glimmer-bright)_22%,transparent)] hover:bg-glimmer-bright active:translate-y-px"
    >
      {children}
      <Icon name="arrow" size={18} strokeWidth={2.2} />
    </button>
  );
}
