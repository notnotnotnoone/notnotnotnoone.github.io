"use client";

import { useEffect, useState } from "react";

export function formatCountdown(seconds: number, prefix = "back in"): string {
  if (seconds <= 0) return prefix === "back in" ? "back now" : `${prefix} 0s`;
  if (seconds < 60) return `${prefix} ${seconds}s`;
  return `${prefix} ${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function Countdown({ seconds, prefix = "back in" }: { seconds: number; prefix?: string }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="countdown">{formatCountdown(left, prefix)}</span>;
}
