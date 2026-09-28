import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("shows the code, its label and a copy button", () => {
    render(<CodeBlock label="terminal" code="flexrouter dashboard" />);
    expect(screen.getByText("flexrouter dashboard")).toBeInTheDocument();
    expect(screen.getByText("terminal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
