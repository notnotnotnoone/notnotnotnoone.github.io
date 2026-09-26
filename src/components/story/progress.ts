export type StoryPos = { step: number; free: boolean };

/**
 * Where the reader is in the story. `top` is the story section's
 * getBoundingClientRect().top; each step takes one viewport of scroll.
 * The section is (count + 1.5) viewports tall: free play starts half a
 * viewport before the pin releases and keeps a full viewport of its own
 * dwell time, same as every narrated step, before the pin releases.
 */
export function storyPos(top: number, vh: number, count: number): StoryPos {
  if (vh <= 0) return { step: 0, free: false };
  const into = -top / vh;
  const step = Math.max(0, Math.min(count - 1, Math.floor(into)));
  return { step, free: into > count - 0.5 };
}
