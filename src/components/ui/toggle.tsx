"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "./toast";

export function Toggle({
  label,
  defaultOn = false,
  save,
  trigger,
  onChange,
}: {
  label: string;
  defaultOn?: boolean;
  save?: (next: boolean) => Promise<unknown>;
  trigger?: number;
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = React.useState(defaultOn);
  const [working, setWorking] = React.useState(false);
  const [fails, setFails] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const busy = React.useRef(false);
  const lastTrigger = React.useRef(0);
  const toast = useToast();

  const flip = React.useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const next = !on;
    setOn(next);
    setFailed(false);
    onChange?.(next);
    const slow = setTimeout(() => setWorking(true), 150);
    try {
      await save?.(next);
    } catch (err) {
      setOn(!next);
      onChange?.(!next);
      setFails((n) => n + 1);
      setFailed(true);
      setTimeout(() => setFailed(false), 1200);
      toast.push({ text: err instanceof Error ? err.message : String(err), tone: "bad" });
    } finally {
      clearTimeout(slow);
      setWorking(false);
      busy.current = false;
    }
  }, [on, save, onChange, toast]);

  React.useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    void flip();
  }, [trigger, flip]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="switch"
      data-state={working ? "working" : failed ? "failed" : undefined}
      onClick={() => void flip()}
    >
      <span key={fails} className={cn("switch-track", fails > 0 && "is-shake")}>
        <i />
      </span>
    </button>
  );
}
