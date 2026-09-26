import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChoreo } from "./use-choreo";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useChoreo", () => {
  it("does nothing at trigger 0, runs every cue in time at trigger 1", () => {
    const a = vi.fn();
    const b = vi.fn();
    const { rerender } = renderHook(({ t }) => useChoreo(t, [[100, a], [300, b]]), { initialProps: { t: 0 } });
    vi.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();

    rerender({ t: 1 });
    vi.advanceTimersByTime(100);
    expect(a).toHaveBeenCalledOnce();
    expect(b).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(b).toHaveBeenCalledOnce();
  });

  it("cancels pending cues on unmount", () => {
    const a = vi.fn();
    const { unmount } = renderHook(() => useChoreo(1, [[500, a]]));
    unmount();
    vi.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();
  });
});
