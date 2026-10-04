import type { RecentResult } from "@/lib/scan/recent";
import { Icon } from "@/components/ui/icon";

interface RecentChipProps {
  recent: RecentResult;
  onReopen: () => void;
}

/** "Last scan: Glass jar · Reopen": brings back the card the user just closed. */
export function RecentChip({ recent, onReopen }: RecentChipProps): React.JSX.Element {
  const item = recent.result.item ?? "Your last scan";
  const isLogged = recent.entryId !== null;
  const label = recent.source === "example" ? "Example" : "Last scan";
  return (
    <button
      type="button"
      onClick={onReopen}
      aria-label={`Reopen ${label.toLowerCase()}: ${item}${isLogged ? ", in your Grove" : ""}`}
      className="mx-auto flex min-h-11 max-w-full items-center gap-2 rounded-full border border-lichen/20 bg-moss-night/55 py-1.5 pr-4 pl-2 text-[13px] text-lichen backdrop-blur-sm transition-colors hover:bg-moss-night/75"
    >
      <span
        aria-hidden="true"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${isLogged ? "bg-moss text-glimmer" : "bg-lichen/10 text-honey-light"}`}
      >
        <Icon name={isLogged ? "check" : "sparkle"} size={14} className={isLogged ? undefined : "fill-glimmer"} />
      </span>
      <span className="min-w-0 truncate">
        <span className="text-lichen/70">{label}: </span>
        <span className="font-semibold">{item}</span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-lichen/50">·</span>
      <span className="shrink-0 font-bold text-honey-light">Reopen</span>
    </button>
  );
}
