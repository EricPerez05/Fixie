import { Icon, type IconName } from "@/components/ui/icon";

interface SectionTitleProps {
  /** Position in the result: recycling comes first, reuse second. */
  number: string;
  eyebrow: string;
  title: string;
  tone: "light" | "dark";
  icon?: IconName;
}

export function SectionTitle({ number, eyebrow, title, tone, icon }: SectionTitleProps): React.JSX.Element {
  const isDark = tone === "dark";
  return (
    <div className="mb-4 flex items-center gap-3">
      <span aria-hidden="true" className={`font-display text-sm ${isDark ? "text-honey-light" : "text-honey"}`}>
        {number}
      </span>
      <div>
        <p className={`text-xs font-bold tracking-wider uppercase ${isDark ? "text-honey-light" : "text-ink-soft"}`}>
          {eyebrow}
        </p>
        <h2 className="font-display text-[1.35rem] leading-tight font-semibold">{title}</h2>
      </div>
      {icon && <Icon name={icon} size={26} className={`ml-auto ${isDark ? "text-glimmer" : "text-moss"}`} />}
    </div>
  );
}
