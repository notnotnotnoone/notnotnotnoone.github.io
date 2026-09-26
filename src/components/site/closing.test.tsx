import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuiltWith } from "./built-with";
import { GetStarted } from "./get-started";

describe("GetStarted", () => {
  it("lists five steps and links to the quickstart", () => {
    const { container } = render(<GetStarted />);
    expect(container.querySelectorAll(".start-step")).toHaveLength(5);
    expect(screen.getAllByRole("link", { name: /Quickstart/ })[0]).toHaveAttribute("href", "/quickstart");
  });
});

describe("BuiltWith", () => {
  it("marks both projects as being updated", () => {
    render(<BuiltWith />);
    expect(screen.getAllByText("Being updated")).toHaveLength(2);
    expect(screen.getAllByText("Runs on an older flexrouter for now.")).toHaveLength(2);
  });
});
