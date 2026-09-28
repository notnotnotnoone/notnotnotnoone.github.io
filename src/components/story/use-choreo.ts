"use client";

import { useEffect, useRef } from "react";

export type Cue = [ms: number, fn: () => void];

/** Plays timed cues once whenever `trigger` changes to a value above 0. */
export function useChoreo(trigger: number, cues: Cue[]) {
  const latest = useRef(cues);
  useEffect(() => {
    latest.current = cues;
  });
  useEffect(() => {
    if (!trigger) return;
    const ids = latest.current.map(([ms, fn]) => setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, [trigger]);
}
