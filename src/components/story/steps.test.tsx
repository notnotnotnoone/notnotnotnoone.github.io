import { describe, expect, it } from "vitest";
import { PAGES } from "./pages";
import { STEPS } from "./steps";

describe("STEPS", () => {
  it("has the nine approved narration lines in order", () => {
    expect(STEPS.map((s) => s.narration)).toEqual([
      "flexrouter, open for the first time.",
      "Pick a free provider and paste a key.",
      "Let AI find the models and rank them.",
      "Check that every model answers.",
      "Send traffic. When a model runs out, the next one answers.",
      "Every request shows its whole journey.",
      "When something breaks, it says why and offers the fix.",
      "Change anything by hand.",
      "See how much free usage is left today.",
    ]);
  });
  it("only uses pages that exist in the menu", () => {
    const ids = new Set(PAGES.map((p) => p.id));
    for (const s of STEPS) expect(ids.has(s.page)).toBe(true);
  });
});
