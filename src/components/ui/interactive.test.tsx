import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulate } from "@/lib/sim";
import { Fold } from "./fold";
import { ToastProvider, useToast, type ToastInput } from "./toast";
import { Toggle } from "./toggle";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function Pusher({ input }: { input: ToastInput }) {
  const { push } = useToast();
  return <button onClick={() => push(input)}>push</button>;
}

describe("toasts", () => {
  // Exiting toasts stay in the DOM until framer-motion finishes their exit
  // animation, so these tests read the provider's own count instead.
  it("keeps at most three", () => {
    const { container } = render(
      <ToastProvider>
        <Pusher input={{ text: "Saved" }} />
      </ToastProvider>,
    );
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByText("push"));
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "3");
  });

  it("runs the action and closes", () => {
    const undo = vi.fn();
    render(
      <ToastProvider>
        <Pusher input={{ text: "Removed ministral-3b", action: { label: "Undo", onAction: undo } }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("push"));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
  });

  it("goes away by itself", async () => {
    const { container } = render(
      <ToastProvider>
        <Pusher input={{ text: "Saved", ms: 1000 }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("push"));
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "0");
  });
});

describe("Toggle", () => {
  it("flips at once", () => {
    render(<Toggle label="nvidia" defaultOn={false} />);
    const sw = screen.getByRole("switch", { name: "nvidia" });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("snaps back when the save fails", async () => {
    render(
      <ToastProvider>
        <Toggle label="nvidia" defaultOn={false} save={() => simulate({ ms: 300, fail: true, reason: "Couldn't save" })} />
      </ToastProvider>,
    );
    const sw = screen.getByRole("switch", { name: "nvidia" });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
  });
});

describe("Fold", () => {
  it("opens when triggered", () => {
    const { rerender } = render(
      <Fold summary="Tried first" trigger={0}>
        groq 429
      </Fold>,
    );
    const details = screen.getByText("Tried first").closest("details")!;
    expect(details.open).toBe(false);
    rerender(
      <Fold summary="Tried first" trigger={1}>
        groq 429
      </Fold>,
    );
    expect(details.open).toBe(true);
  });
});
