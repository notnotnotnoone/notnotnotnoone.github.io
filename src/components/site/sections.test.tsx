import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EXPLAINERS, HowItWorks } from "./how-it-works";

describe("HowItWorks", () => {
  it("has the six explainers", () => {
    render(<HowItWorks />);
    expect(EXPLAINERS).toHaveLength(6);
    for (const e of EXPLAINERS) expect(screen.getByRole("heading", { name: e.title })).toBeInTheDocument();
  });
});
