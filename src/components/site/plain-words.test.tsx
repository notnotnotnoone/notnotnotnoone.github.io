import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlainWords } from "./plain-words";

describe("PlainWords", () => {
  it("has the approved heading, short answer and date note", () => {
    render(<PlainWords />);
    expect(screen.getByRole("heading", { name: "What is flexrouter?" })).toBeInTheDocument();
    expect(
      screen.getByText("a tool that lets apps run on free AI without hitting the limits.", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Limits as of September 2026.")).toBeInTheDocument();
    expect(screen.getByText(/can fire off a dozen requests for a single thing you ask it/)).toBeInTheDocument();
  });
});
