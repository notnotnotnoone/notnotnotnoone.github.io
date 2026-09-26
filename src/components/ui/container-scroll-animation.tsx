"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMedia } from "@/lib/use-media";

/**
 * The window tilts back and scales down as its section scrolls in, and is
 * flat by the time the section reaches the top of the viewport (where the
 * story pins it). `targetRef` is the tall story section.
 */
export function ContainerScroll({
  titleComponent,
  children,
  targetRef,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start end", "start start"] });
  const reduce = useReducedMotion();
  const isMobile = useMedia("(max-width: 768px)");

  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : isMobile ? [0.7, 0.92] : [1.05, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, 0]);
  const glow = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  return (
    <div className="scroll-stage">
      <motion.div className="scroll-title" style={{ y: lift }}>
        {titleComponent}
      </motion.div>
      <motion.div className="scroll-card box" style={{ rotateX: rotate, scale }}>
        <motion.span className="scroll-card-glow" style={{ opacity: glow }} aria-hidden />
        {children}
      </motion.div>
    </div>
  );
}
