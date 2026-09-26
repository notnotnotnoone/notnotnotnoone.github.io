"use client";

import { useEffect, useRef } from "react";
import {  } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** A soft green light that follows the pointer and lights up the dot grid under it. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.dataset.on = "";
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [reduce]);

  return <div ref={ref} className="spotlight" aria-hidden />;
}
