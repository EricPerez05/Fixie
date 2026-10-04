import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountScreen } from "@/components/account/account-screen";
import type { AccountState } from "@/hooks/use-account";
import type { Preferences } from "@/lib/scan/schema";

afterEach(cleanup);

const answers: Preferences = { space: "balcony", interests: ["plants", "gifts"], tools: [] };

function renderScreen(account: AccountState, preferences: Preferences | null = answers) {
  const handlers = { onSignIn: vi.fn(), onSignOut: vi.fn(), onEditAnswers: vi.fn() };
  render(<AccountScreen account={account} preferences={preferences} {...handlers} />);
  return handlers;
}

describe("AccountScreen", () => {
  it("offers Sign in with Google when signed out", () => {
    const { onSignIn } = renderScreen({ status: "signed_out" });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(onSignIn).toHaveBeenCalledOnce();
    expect(screen.getByText("On this device")).toBeInTheDocument();
  });

  it("shows who is signed in, that answers sync, and signs out", () => {
    const { onSignOut } = renderScreen({ status: "signed_in", userId: "u1", firstName: "Duru" });
    expect(screen.getByText("Signed in as Duru")).toBeInTheDocument();
    expect(screen.getByText("Synced")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("says sign-in is coming when Supabase isn't set up, with no sign-in button", () => {
    renderScreen({ status: "unavailable" });
    expect(screen.getByText(/Sign-in is coming soon/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
  });

  it("is busy while the account loads", () => {
    renderScreen({ status: "loading" });
    expect(screen.getByRole("region", { name: "Your account" })).toHaveAttribute("aria-busy", "true");
  });

  it("summarizes the answers and opens them for editing", () => {
    const { onEditAnswers } = renderScreen({ status: "signed_out" });
    expect(screen.getByText("A balcony")).toBeInTheDocument();
    expect(screen.getByText("Plants")).toBeInTheDocument();
    expect(screen.getByText("Gifts")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit answers" }));
    expect(onEditAnswers).toHaveBeenCalledOnce();
  });

  it("asks for answers when there are none", () => {
    renderScreen({ status: "signed_out" }, null);
    expect(screen.getByRole("button", { name: "Answer the questions" })).toBeInTheDocument();
  });
});
