import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRotatingIndex } from "./use-rotating-index";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useRotatingIndex", () => {
  it("steps every interval and wraps", () => {
    const { result } = renderHook(() => useRotatingIndex(3, 1000));
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
  });
});
