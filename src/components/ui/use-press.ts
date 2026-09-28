"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextPress, type PressState } from "@/lib/press";

/** Runs one async task at a time and reports idle / working / done / failed. */
export function usePress(settleMs = 1800) {
  const [state, setState] = useState<PressState>("idle");
  const [reason, setReason] = useState("");
  const busy = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(settle.current), []);

  const run = useCallback(
    async (task: () => Promise<unknown>) => {
      if (busy.current) return;
      busy.current = true;
      clearTimeout(settle.current);
      setReason("");
      setState((s) => nextPress(s, "start"));
      try {
        await task();
        setState((s) => nextPress(s, "ok"));
      } catch (err) {
        setReason(err instanceof Error ? err.message : String(err));
        setState((s) => nextPress(s, "fail"));
      } finally {
        busy.current = false;
        settle.current = setTimeout(() => setState((s) => nextPress(s, "reset")), settleMs);
      }
    },
    [settleMs],
  );

  return { state, reason, run };
}
