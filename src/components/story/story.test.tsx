import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Story } from "./Story";

describe("Story", () => {
  it("starts on the first step", () => {
    render(<Story />);
    expect(screen.getByText("flexrouter, open for the first time.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Dashboard pages" })).toBeInTheDocument();
  });
});
