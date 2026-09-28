import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { TweakScreen } from "./tweak";

// A single big advanceTimersByTimeAsync can miss a setTimeout scheduled by a
// React effect that reacted to an earlier fake-timer tick, so step in chunks.
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

describe("TweakScreen choreography", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("Undo brings ministral back and does not remove it a second time", async () => {
    render(
      <ToastProvider>
        <TweakScreen trigger={1} />
      </ToastProvider>,
    );

    // cue.remove bumps at 5200ms; the click's simulate() then takes 400ms.
    await advanceInChunks(6200);
    expect(screen.queryByText("mistral/ministral-3b-2512")).not.toBeInTheDocument();
    expect(screen.getByText("Removed mistral/ministral-3b-2512")).toBeInTheDocument();

    // the 6900ms cue calls restore(), which should bring the row back.
    await advanceInChunks(1100);
    expect(screen.getByText("mistral/ministral-3b-2512")).toBeInTheDocument();

    // The restored row remounts a fresh Remove button. Give a stale trigger
    // time to (mis)fire and its simulate() time to resolve, then confirm the
    // model held and no second "Removed ... Undo" toast appeared.
    await advanceInChunks(1700);
    expect(screen.getByText("mistral/ministral-3b-2512")).toBeInTheDocument();
    expect(screen.queryByText("Removed mistral/ministral-3b-2512")).not.toBeInTheDocument();
  });
});
