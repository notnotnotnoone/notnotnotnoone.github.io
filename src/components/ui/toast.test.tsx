import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

async function advanceInChunks(totalMs: number, chunkMs = 100) {
  let left = totalMs;
  while (left > 0) {
    const step = Math.min(chunkMs, left);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(step);
    });
    left -= step;
  }
}

function Pusher() {
  const toast = useToast();
  React.useEffect(() => {
    toast.push({ text: "Couldn't save: the settings file is busy", ms: 4200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Re-renders ToastProvider's subtree on an interval, the way an unrelated
 * story-step or parent state change would, to prove the toast's own timer
 * survives it. */
function Host() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <ToastProvider>
      <Pusher />
    </ToastProvider>
  );
}

function ResetHost({ resetKey }: { resetKey: number }) {
  return (
    <ToastProvider resetKey={resetKey}>
      <Pusher />
    </ToastProvider>
  );
}

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("clears every toast when resetKey changes, e.g. a story step change", async () => {
    const { rerender } = render(<ResetHost resetKey={0} />);
    await advanceInChunks(0);
    expect(screen.getByText("Couldn't save: the settings file is busy")).toBeInTheDocument();

    await act(async () => {
      rerender(<ResetHost resetKey={1} />);
    });
    // The cleared toast is still animating its exit; give it time to finish.
    await advanceInChunks(500);
    expect(screen.queryByText("Couldn't save: the settings file is busy")).not.toBeInTheDocument();
  });

  it("dismisses at its own ms even while the provider keeps re-rendering", async () => {
    render(<Host />);
    await advanceInChunks(0);
    expect(screen.getByText("Couldn't save: the settings file is busy")).toBeInTheDocument();

    // Just before its 4200ms is up, it should still be there.
    await advanceInChunks(4000);
    expect(screen.getByText("Couldn't save: the settings file is busy")).toBeInTheDocument();

    // Comfortably past 4200ms (with the 500ms re-render interval still
    // ticking throughout), it should be gone rather than living on.
    await advanceInChunks(1200);
    expect(screen.queryByText("Couldn't save: the settings file is busy")).not.toBeInTheDocument();
  });
});
