import type { AccountState } from "@/hooks/use-account";
import { isEmptyPreferences, type Preferences } from "@/lib/scan/schema";
import { Icon } from "../ui/icon";
import { GoogleSignInButton } from "../ui/google-sign-in-button";
import { INTEREST_LABEL, SPACE_LABEL, TOOL_LABEL } from "../ui/profile-form";

interface AccountScreenProps {
  account: AccountState;
  preferences: Preferences | null;
  onSignIn: () => void;
  onSignOut: () => void;
  /** Opens the green "Tell the fairies about you" questions. */
  onEditAnswers: () => void;
}

/**
 * The Home tab: optional Google sign-in, and a summary of the person's
 * answers with a way to change them. Signed in, the answers sync to the
 * account; otherwise they live on this device. The bottom nav sits over the
 * last 5.5rem, so the content stops above it.
 */
export function AccountScreen({
  account,
  preferences,
  onSignIn,
  onSignOut,
  onEditAnswers,
}: AccountScreenProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col gap-[clamp(0.75rem,2.4cqh,1.25rem)] px-5 pt-[calc(var(--safe-top)+1rem)] pb-[calc(5.5rem+var(--safe-bottom))]">
      <header className="text-center">
        <h2 className="font-display text-[1.75rem] leading-tight font-bold tracking-tight text-lichen">Home</h2>
        <p className="mt-0.5 text-[13px] text-lichen/75">Your account and your answers to the fairies</p>
      </header>

      <AccountCard account={account} onSignIn={onSignIn} onSignOut={onSignOut} />
      <AnswersCard preferences={preferences} isSynced={account.status === "signed_in"} onEdit={onEditAnswers} />
    </div>
  );
}

const CARD = "rounded-3xl border border-lichen/12 bg-moss-night/45 p-[clamp(1rem,2.6cqh,1.25rem)]";

function AccountCard({
  account,
  onSignIn,
  onSignOut,
}: Pick<AccountScreenProps, "account" | "onSignIn" | "onSignOut">): React.JSX.Element {
  if (account.status === "signed_in") {
    const initial = account.firstName?.[0]?.toUpperCase();
    return (
      <section aria-label="Your account" className={`${CARD} flex items-center gap-3`}>
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-glimmer font-display text-lg font-bold text-moss-deep"
        >
          {initial ?? <Icon name="sparkle" size={18} className="fill-current" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-lichen">
            {account.firstName ? `Signed in as ${account.firstName}` : "Signed in"}
          </p>
          <p className="text-[13px] text-lichen/70">Your answers follow you to every device.</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-honey-light"
        >
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Your account" aria-busy={account.status === "loading"} className={`${CARD} text-center`}>
      <p className="font-display text-lg font-semibold text-lichen">Keep your answers everywhere</p>
      {account.status === "loading" && <p className="mt-1 text-sm text-lichen/70">Checking your account…</p>}
      {account.status === "signed_out" && (
        <>
          <p className="mt-1 text-sm text-lichen/70">Sign in and your answers sync to every device you use.</p>
          <div className="mt-3 flex justify-center">
            <GoogleSignInButton onClick={onSignIn} />
          </div>
        </>
      )}
      {account.status === "unavailable" && (
        <p className="mt-1 text-sm text-lichen/70">Sign-in is coming soon. For now, your answers are saved on this device.</p>
      )}
    </section>
  );
}

function AnswersCard({
  preferences,
  isSynced,
  onEdit,
}: {
  preferences: Preferences | null;
  isSynced: boolean;
  onEdit: () => void;
}): React.JSX.Element {
  const hasAnswers = preferences !== null && !isEmptyPreferences(preferences);
  return (
    <section aria-labelledby="answers-heading" className={`${CARD} flex min-h-0 flex-col`}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="answers-heading" className="font-display text-lg font-semibold text-honey-light">
          Your answers
        </h3>
        <span className="text-xs font-semibold text-lichen/60">{isSynced ? "Synced" : "On this device"}</span>
      </div>

      {hasAnswers ? (
        <dl className="mt-2 flex min-h-0 flex-col gap-2 overflow-hidden text-sm">
          <AnswerRow label="Space" values={preferences.space ? [SPACE_LABEL[preferences.space]] : []} />
          <AnswerRow label="Enjoys" values={preferences.interests.map((interest) => INTEREST_LABEL[interest])} />
          <AnswerRow label="Tools" values={preferences.tools.map((tool) => TOOL_LABEL[tool])} />
        </dl>
      ) : (
        <p className="mt-2 text-sm text-lichen/70">
          No answers yet. Tell the fairies about your space and tools, and your upcycling ideas will fit you.
        </p>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="mt-[clamp(0.75rem,2cqh,1rem)] inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-glimmer px-5 text-[15px] font-bold text-moss-deep hover:bg-glimmer-bright"
      >
        <Icon name="wand" size={18} />
        {hasAnswers ? "Edit answers" : "Answer the questions"}
      </button>
    </section>
  );
}

function AnswerRow({ label, values }: { label: string; values: string[] }): React.JSX.Element {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-14 shrink-0 text-xs font-bold tracking-wide text-lichen/60 uppercase">{label}</dt>
      <dd className="flex min-w-0 flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} className="rounded-full bg-lichen/12 px-2.5 py-0.5 font-semibold text-lichen">
              {value}
            </span>
          ))
        ) : (
          <span className="text-lichen/50">Not set</span>
        )}
      </dd>
    </div>
  );
}
