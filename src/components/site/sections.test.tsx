import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardTour, SHOTS } from "./dashboard-tour";
import { EXPLAINERS, HowItWorks } from "./how-it-works";

describe("DashboardTour", () => {
  it("switches caption when a tab is picked", () => {
    render(<DashboardTour />);
    expect(screen.getByText(SHOTS[0].caption)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Allowance" }));
    expect(screen.getByRole("tab", { name: "Allowance" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(SHOTS.find((s) => s.id === "allowance")!.caption)).toBeInTheDocument();
  });
});

describe("HowItWorks", () => {
  it("has the eight explainers and the closing line", () => {
    render(<HowItWorks />);
    expect(EXPLAINERS).toHaveLength(8);
    for (const e of EXPLAINERS) expect(screen.getByRole("heading", { name: e.title })).toBeInTheDocument();
    expect(screen.getByText(/works with any app that can talk to OpenAI's API/)).toBeInTheDocument();
  });
});
