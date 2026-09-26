"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function CountUp({ to, play, className }: { to: number; play: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(play && !reduce ? 0 : to);

  useEffect(() => {
    if (!play || reduce) return;
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [play, reduce, to]);

  return <span className={className}>{fmt(play && !reduce ? shown : to)}</span>;
}
