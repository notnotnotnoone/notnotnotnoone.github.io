import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardTour, SHOTS } from "./dashboard-tour";
import { EXPLAINERS, HowItWorks } from "./how-it-works";

describe("DashboardTour", () => {
  it("switches screenshot and caption when a tab is picked", async () => {
    render(<DashboardTour />);
    expect(screen.getByText(SHOTS[0].caption)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Allowance" }));
    expect(screen.getByRole("tab", { name: "Allowance" })).toHaveAttribute("aria-selected", "true");
    // AnimatePresence mode="wait" keeps the old figure mounted until its exit
    // animation finishes, so the new caption appears asynchronously.
    await waitFor(() =>
      expect(screen.getByText(SHOTS.find((s) => s.id === "allowance")!.caption)).toBeInTheDocument(),
    );
    expect(screen.getByRole("img", { name: "The Allowance page" })).toBeInTheDocument();
  });
});

describe("HowItWorks", () => {
  it("has the six explainers", () => {
    render(<HowItWorks />);
    expect(EXPLAINERS).toHaveLength(6);
    for (const e of EXPLAINERS) expect(screen.getByRole("heading", { name: e.title })).toBeInTheDocument();
  });
});
