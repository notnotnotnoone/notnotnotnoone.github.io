import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestScreen } from "./request";
import { StatusScreen } from "./status";
import { counts, retire, settle, START_READY, START_ROWS } from "./status-logic";

describe("status logic", () => {
  it("counts rows by status on top of the ready ones", () => {
    const c = counts(START_ROWS, START_READY);
    expect(c).toMatchObject({ ready: 4, needs: 1, struggling: 1 });
  });
  it("settles a row to ready, then retires it", () => {
    const settled = settle(START_ROWS, "mistral/mistral-large-2512");
    expect(counts(settled, START_READY)).toMatchObject({ ready: 5, needs: 0 });
    expect(retire(settled, "mistral/mistral-large-2512")[0].gone).toBe(true);
  });
});

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

describe("screens", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens the request sheet with its journey", async () => {
    render(<RequestScreen trigger={1} />);
    await advanceInChunks(1500);
    expect(screen.getByRole("dialog", { name: "Request req_6565bd6b" })).toBeInTheDocument();
    expect(screen.getByText("Tried first").closest("details")!.open).toBe(true);
  });

  it("fixes the row that needs you and says so", async () => {
    render(<StatusScreen trigger={1} />);
    expect(screen.getByText("Not on your Mistral plan.")).toBeInTheDocument();
    await advanceInChunks(2000);
    expect(screen.getByText("Nothing needs you.")).toBeInTheDocument();
  });
});
