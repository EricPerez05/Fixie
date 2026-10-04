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
  /** Un-logging, offered once the result is in the Grove. */
  removal?: RemoveControl;
}

export type RemoveStatus = "idle" | "confirming" | "removing" | "error";

export interface RemoveControl {
  status: RemoveStatus;
  /** Asks "remove it and its photo?" before anything is deleted. */
  onAsk: () => void;
  onConfirm: () => void;
  onCancel: () => void;
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
      <Icon name={isDone ? "check" : "forest"} size={18} />
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
    const { removal } = control;
    if (removal && removal.status !== "idle") return <RemoveConfirm removal={removal} />;
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={control.onViewGrove}
          className="flex min-h-11 items-center gap-1 px-3 text-sm font-semibold text-moss underline-offset-4 hover:underline"
        >
          View in Grove
          <Icon name="arrow" size={14} />
        </button>
        {removal && (
          <>
            <span aria-hidden="true" className="text-ink-soft">
              ·
            </span>
            <button
              type="button"
              onClick={removal.onAsk}
              className="min-h-11 px-3 text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
            >
              Remove
            </button>
          </>
        )}
      </div>
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

/**
 * The inline "are you sure?" for un-logging: it deletes the branch and its
 * photo for good, so it never happens on one tap.
 */
function RemoveConfirm({ removal }: { removal: RemoveControl }): React.JSX.Element {
  const isBusy = removal.status === "removing";
  return (
    <div className="flex min-h-11 items-center justify-center gap-1 text-xs">
      <p className={removal.status === "error" ? "font-semibold text-ember" : "text-ink-soft"}>
        {removal.status === "error" ? "Couldn't remove it. Try again?" : "Remove it and its photo?"}
      </p>
      <button
        type="button"
        onClick={removal.onConfirm}
        disabled={isBusy}
        aria-busy={isBusy || undefined}
        className="min-h-11 px-2.5 text-sm font-semibold text-ember disabled:opacity-60"
      >
        {isBusy ? "Removing…" : "Remove"}
      </button>
      <button
        type="button"
        onClick={removal.onCancel}
        disabled={isBusy}
        className="min-h-11 px-2.5 text-sm font-semibold text-moss disabled:opacity-60"
      >
        Keep
      </button>
    </div>
  );
}
