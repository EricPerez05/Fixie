import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "@/components/ui/top-bar";

afterEach(cleanup);

describe.each(["dark", "light"] as const)("TopBar logo (%s)", (tone) => {
  it("is one home button named 'Fixie, back to start' when it leads home", () => {
    render(<TopBar tone={tone} isDemo={false} onHome={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Fixie, back to start" })).toBeInTheDocument();
    // The logo inside is hidden, so it isn't announced twice.
    expect(screen.queryByRole("img", { name: "Fixie" })).not.toBeInTheDocument();
  });

  it("is an image named 'Fixie' otherwise", () => {
    render(<TopBar tone={tone} isDemo={false} />);
    expect(screen.getByRole("img", { name: "Fixie" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fixie, back to start" })).not.toBeInTheDocument();
  });

  it("never exposes the dotless ı or the shapes as text", () => {
    const { container } = render(<TopBar tone={tone} isDemo={false} />);
    expect(container.querySelector("header")).not.toHaveTextContent(/[ıFixe]/);
  });
});
