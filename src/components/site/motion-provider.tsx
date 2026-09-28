"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Makes every framer-motion animation in the app respect prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
