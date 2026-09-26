import { describe, expect, it } from "vitest";
import { storyPos } from "./progress";

describe("storyPos", () => {
  const vh = 800;
  it("is step 0 before the section reaches the top", () => {
    expect(storyPos(400, vh, 9)).toEqual({ step: 0, free: false });
  });
  it("moves one step per viewport scrolled", () => {
    expect(storyPos(-1, vh, 9)).toEqual({ step: 0, free: false });
    expect(storyPos(-800, vh, 9)).toEqual({ step: 1, free: false });
    expect(storyPos(-800 * 4.5, vh, 9)).toEqual({ step: 4, free: false });
  });
  it("stays on the last step, then switches to free play half a viewport before the end", () => {
    expect(storyPos(-800 * 8.2, vh, 9)).toEqual({ step: 8, free: false });
    expect(storyPos(-800 * 8.6, vh, 9)).toEqual({ step: 8, free: true });
    expect(storyPos(-800 * 20, vh, 9)).toEqual({ step: 8, free: true });
  });
  it("survives a zero-height viewport", () => {
    expect(storyPos(-100, 0, 9)).toEqual({ step: 0, free: false });
  });
});
