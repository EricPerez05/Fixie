import { Icon } from "@/components/ui/icon";

export type LogStatus = "idle" | "logging" | "logged" | "error";

/** What the result card needs to offer "Log to Grove". Absent when the result can't be logged. */
export interface LogControl {
  status: LogStatus;
  /** Friendly copy for the error state. */
  errorMessage?: string;
  /** True when a photo will be saved with the entry, so the consent line can say so. */
  hasPhoto: boolean;
  onLog: () => void;
  onViewGrove: () => void;
}

const LABEL: Record<LogStatus, string> = {
  idle: "Log to Grove",
  logging: "Logging…",
  logged: "In your Grove",
  error: "Try again",
};

/** The Log button, sized to share a row with "Scan another item". */
export function LogToGroveButton({ control }: { control: LogControl }): React.JSX.Element {
  const { status } = control;
  const isDone = status === "logged";
  const isBusy = status === "logging";
  return (
    <button
      type="button"
      onClick={control.onLog}
      disabled={isDone || isBusy}
      aria-busy={isBusy || undefined}
      className={`flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold whitespace-nowrap ${
        isDone ? "bg-sage text-moss" : "bg-moss text-glimmer active:bg-moss-deep disabled:opacity-80"
      }`}
    >
      <Icon name={isDone ? "check" : "leaf"} size={18} />
      {LABEL[status]}
    </button>
  );
}

/**
 * The line under the buttons: what logging stores (it is the consent step for
 * saving the photo), the failure copy, or a way to the Grove once logged.
 */
export function LogStatusLine({ control }: { control: LogControl }): React.JSX.Element {
  if (control.status === "logged") {
    return (
      <button
        type="button"
        onClick={control.onViewGrove}
        className="mx-auto flex min-h-11 items-center gap-1 px-3 text-sm font-semibold text-moss underline-offset-4 hover:underline"
      >
        View in Grove
        <Icon name="arrow" size={14} />
      </button>
    );
  }
  if (control.status === "error") {
    return (
      <p role="alert" className="text-center text-xs font-semibold text-ember">
        {control.errorMessage ?? "That didn't save. Try again."}
      </p>
    );
  }
  return (
    <p className="text-center text-xs text-ink-soft">
      {control.hasPhoto ? "Saves this photo and result to your Grove." : "Saves this result to your Grove."}
    </p>
  );
}
