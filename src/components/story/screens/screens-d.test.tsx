import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DragBoard } from "../drag-board";
import { dragReducer, type Board } from "../drag";
import { AllowanceScreen } from "./allowance";

const start: Board = { picked: null, buckets: { smart: ["a", "b"], fast: ["c"] } };

describe("dragReducer", () => {
  it("picks and drops into another bucket", () => {
    const picked = dragReducer(start, { type: "pick", id: "a" });
    expect(picked.picked).toBe("a");
    const dropped = dragReducer(picked, { type: "drop", bucket: "fast" });
    expect(dropped).toEqual({ picked: null, buckets: { smart: ["b"], fast: ["c", "a"] } });
  });
  it("unpicks when the same card is picked twice", () => {
    const s = dragReducer(dragReducer(start, { type: "pick", id: "a" }), { type: "pick", id: "a" });
    expect(s.picked).toBeNull();
  });
  it("ignores a drop with nothing picked, and cancel clears the pick", () => {
    expect(dragReducer(start, { type: "drop", bucket: "fast" })).toBe(start);
    expect(dragReducer({ ...start, picked: "a" }, { type: "cancel" }).picked).toBeNull();
  });
});

describe("DragBoard", () => {
  it("moves a card by tap, then tap", () => {
    render(<DragBoard initial={{ smart: ["googleai/gemma-4-26b"], fast: [] }} trigger={0} move={{ id: "", to: "" }} />);
    fireEvent.click(screen.getByRole("button", { name: /gemma-4-26b/ }));
    fireEvent.click(screen.getByRole("button", { name: /fast/ }));
    const fast = screen.getByRole("button", { name: /fast/ }).closest(".drag-zone")!;
    expect(fast).toHaveTextContent("googleai/gemma-4-26b");
  });
});

describe("AllowanceScreen", () => {
  it("shows the total and marks where each number comes from", () => {
    render(<AllowanceScreen trigger={0} />);
    expect(screen.getByText("32,866")).toBeInTheDocument();
    expect(screen.getAllByText("Your limit").length).toBeGreaterThan(0);
    expect(screen.getByText("Groq says")).toBeInTheDocument();
  });
});
