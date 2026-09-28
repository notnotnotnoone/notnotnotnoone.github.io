"use client";

import { AnimatePresence, motion, type MotionProps } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { RouteField } from "@/components/site/route-field";
import { copyText } from "@/lib/copy";
import { CHANGELOG } from "@/lib/links";
import { Button, ButtonLink } from "./button";
import { useRotatingIndex } from "./use-rotating-index";

export const HERO_WORDS = ["groq", "google", "mistral", "cerebras", "openrouter"];
const INSTALL = "pip install flexrouter";
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const i = useRotatingIndex(HERO_WORDS.length, 2000);
  const reduce = useReducedMotion();

  const enter = (n: number): MotionProps => ({
    initial: { opacity: 0, y: 18, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: reduce ? { duration: 0.2 } : { delay: 0.15 + n * 0.12, duration: 0.8, ease: EASE },
  });

  return (
    <header className="hero">
      <RouteField />
      <div className="wrap hero-in">
        <motion.div {...enter(0)}>
          <ButtonLink kind="ghost" size="sm" href={CHANGELOG} external icon={ArrowUpRight} label="flexrouter 2.3 · see what changed" className="hero-badge" />
        </motion.div>

        <motion.h1 className="hero-title" {...enter(1)}>
          <span className="sr-only">Your app keeps answering when one provider runs out.</span>
          <span aria-hidden>
            Your app keeps answering when{" "}
            <span className="hero-word">
              <span className="hero-word-size">openrouter</span>
              {/* Only the current word is mounted. It always enters from below and
                  leaves upward, so wrapping from the last word back to the first
                  never reverses direction or sweeps the other words through. */}
              <AnimatePresence initial={false}>
                <motion.span
                  key={HERO_WORDS[i]}
                  className="hero-word-item"
                  initial={{ opacity: 0, y: reduce ? 0 : "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : "-100%" }}
                  transition={{ duration: reduce ? 0.2 : 0.45, ease: EASE }}
                >
                  {HERO_WORDS[i]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            runs out.
          </span>
        </motion.h1>

        <motion.p className="hero-sub" {...enter(2)}>
          flexrouter pools the free tiers of several AI providers behind one local address.
        </motion.p>

        <motion.div className="hero-cta" {...enter(3)}>
          <ButtonLink kind="primary" size="lg" href="/quickstart" icon={ArrowRight} label="Quickstart" />
        </motion.div>

        <motion.div className="hero-cmd" {...enter(4)}>
          <code>
            <span className="text-ink-4">$</span> {INSTALL}
          </code>
          <Button
            kind="copy"
            size="sm"
            icon={Copy}
            label="Copy"
            doneLabel="Copied"
            run={async (source) => {
              if (source === "user") await copyText(INSTALL);
            }}
          />
        </motion.div>
      </div>
    </header>
  );
}
