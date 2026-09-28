import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuiltWith } from "./built-with";

describe("BuiltWith", () => {
  it("marks both projects as being updated, with one GitHub link each", () => {
    render(<BuiltWith />);
    expect(screen.getAllByText("Being updated")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /GitHub/ })).toHaveLength(2);
  });
});
