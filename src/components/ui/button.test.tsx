import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulate } from "@/lib/sim";
import { Button } from "./button";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Button", () => {
  it("shows working, then done, then settles back to idle", async () => {
    render(
      <Button kind="primary" label="Save" workingLabel="Saving" doneLabel="Saved" run={() => simulate({ ms: 500 })} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "working");
    expect(screen.getByText("Saving")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "done");
    expect(screen.getByText("Saved")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1800);
    });
    expect(screen.getByRole("button")).not.toHaveAttribute("data-state");
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("shows the reason beside the button when the run fails", async () => {
    render(
      <Button
        kind="primary"
        label="Save"
        run={() => simulate({ ms: 300, fail: true, reason: "config.yaml is read-only right now" })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "failed");
    expect(screen.getByRole("status")).toHaveTextContent("config.yaml is read-only right now");
  });

  it("runs with source 'trigger' when trigger is bumped, and 'user' on click", async () => {
    const run = vi.fn(() => simulate({ ms: 100 }));
    const { rerender } = render(<Button label="Test all" run={run} trigger={0} />);
    expect(run).not.toHaveBeenCalled();

    rerender(<Button label="Test all" run={run} trigger={1} />);
    expect(run).toHaveBeenLastCalledWith("trigger");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    fireEvent.click(screen.getByRole("button"));
    expect(run).toHaveBeenLastCalledWith("user");
  });

  it("ignores clicks while working", () => {
    const run = vi.fn(() => simulate({ ms: 500 }));
    render(<Button label="Retry" run={run} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("can show a frozen state", () => {
    render(<Button label="Save" doneLabel="Saved" state="done" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "done");
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
