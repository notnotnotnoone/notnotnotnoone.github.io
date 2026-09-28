import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./use-reduced-motion";

function fakeMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((_event: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_event: string, cb: () => void) => listeners.delete(cb)),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  return {
    mql,
    fire: () => listeners.forEach((cb) => cb()),
  };
}

describe("useReducedMotion", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it("server snapshot is always false, even when the client's system preference is reduced", () => {
    window.matchMedia = () => fakeMatchMedia(true).mql as unknown as MediaQueryList;
    function Probe() {
      return <>{useReducedMotion() ? "reduced" : "not-reduced"}</>;
    }
    expect(renderToString(<Probe />)).toBe("not-reduced");
  });

  it("reads the current preference from matchMedia on the client", () => {
    window.matchMedia = () => fakeMatchMedia(true).mql as unknown as MediaQueryList;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("subscribes to changes and updates when the preference flips", () => {
    let matches = false;
    const state = fakeMatchMedia(false);
    window.matchMedia = () => {
      state.mql.matches = matches;
      return state.mql as unknown as MediaQueryList;
    };

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    matches = true;
    act(() => state.fire());
    expect(result.current).toBe(true);
  });

  it("removes its change listener on cleanup", () => {
    const state = fakeMatchMedia(false);
    window.matchMedia = () => state.mql as unknown as MediaQueryList;

    const { unmount } = renderHook(() => useReducedMotion());
    expect(state.mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(state.mql.removeEventListener).not.toHaveBeenCalled();

    unmount();
    expect(state.mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
