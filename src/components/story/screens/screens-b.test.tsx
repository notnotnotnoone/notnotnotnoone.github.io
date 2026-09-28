import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestAllScreen } from "./test-all";
import { clock, KEY_SWITCH_AT, routeOne, START_LANES, type Lane } from "./traffic-logic";

function run(n: number, lanes: Lane[] = START_LANES) {
  const routes = [];
  let cur = lanes;
  for (let i = 1; i <= n; i++) {
    const r = routeOne(cur, i);
    cur = r.lanes;
    routes.push(r.route);
  }
  return { lanes: cur, routes };
}

describe("routeOne", () => {
  it("sends to the first lane with room", () => {
    const { lanes, routes } = run(1);
    expect(routes[0]).toMatchObject({ kind: "ok", to: "groq" });
    expect(lanes[0].used).toBe(START_LANES[0].used + 1);
  });
  it("switches to key 2 when key 1 hits its limit", () => {
    const n = KEY_SWITCH_AT - START_LANES[0].used;
    expect(run(n).routes[n - 1].kind).toBe("rotate");
  });
  it("fails over to the next provider once the first is full", () => {
    const full = START_LANES[0].limit - START_LANES[0].used;
    const { routes } = run(full + 1);
    expect(routes[full]).toMatchObject({ kind: "failover", from: "groq", to: "googleai" });
  });
  it("reports nothing answered when every lane is full", () => {
    const full = START_LANES.map((l) => ({ ...l, used: l.limit }));
    expect(routeOne(full, 1).route.kind).toBe("none");
  });
  it("formats a clock time", () => {
    expect(clock(3)).toBe("09:06:13");
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

describe("TestAllScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("tests every model, then completes Get started", async () => {
    render(<TestAllScreen trigger={1} />);
    // Test all starts at 300 ms and takes 6 x 180 ms; its done label shows for 1.8 s.
    // Advanced in chunks: a single big advance can miss a setTimeout scheduled by a
    // React effect that itself reacted to an earlier fake-timer tick (see implementer-rules.md).
    await advanceInChunks(2000);
    expect(screen.getByText("All 6 work")).toBeInTheDocument();
    // Copy curl is pressed at 2600 ms and takes 250 ms.
    await advanceInChunks(1000);
    expect(screen.getByText("5 of 5 done")).toBeInTheDocument();
  });
});
