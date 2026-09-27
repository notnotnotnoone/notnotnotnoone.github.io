"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ToastProvider } from "@/components/ui/toast";
import { MiniDash } from "./mini-dash";
import type { PageId } from "./pages";
import { storyPos, type StoryPos } from "./progress";
import { STEPS } from "./steps";

const AVAILABLE: ReadonlySet<PageId> = new Set(STEPS.map((s) => s.page));
const LAST = STEPS.length - 1;

/** The last step that shows a page, so free play can jump to it. */
function stepForPage(page: PageId): number {
  for (let i = LAST; i >= 0; i--) if (STEPS[i].page === page) return i;
  return LAST;
}

export function Story() {
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = React.useState<StoryPos>({ step: 0, free: false });
  const [freeStep, setFreeStep] = React.useState(LAST);

  React.useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const next = storyPos(el.getBoundingClientRect().top, window.innerHeight, STEPS.length);
      setPos((p) => (p.step === next.step && p.free === next.free ? p : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shown = pos.free ? freeStep : pos.step;
  const step = STEPS[shown];
  const Screen = step.Screen;

  const replay = () => {
    setFreeStep(LAST);
    const top = (ref.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  const title = (
    <div className="story-narration" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pos.free ? "free" : pos.step}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="story-line"
        >
          {pos.free ? (
            <>
              <span>Everything here is live. Press anything.</span>
              <Button kind="ghost" size="sm" icon={RotateCcw} label="Replay story" onClick={replay} />
            </>
          ) : (
            <>
              <span className="story-count">
                {pos.step}/{LAST}
              </span>
              <span>{STEPS[pos.step].narration}</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <section
      ref={ref}
      id="story"
      aria-label="flexrouter, step by step"
      className="story"
      style={{ height: `${(STEPS.length + 1.5) * 100}vh` }}
    >
      <div className="story-pin">
        <ContainerScroll targetRef={ref} titleComponent={title}>
          <ToastProvider resetKey={shown}>
            <MiniDash page={step.page} available={AVAILABLE} onPick={pos.free ? (p) => setFreeStep(stepForPage(p)) : undefined}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${shown}-${pos.free ? "free" : "story"}`}
                  className="md-screen-inner"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Screen trigger={pos.free ? 0 : 1} />
                </motion.div>
              </AnimatePresence>
            </MiniDash>
          </ToastProvider>
        </ContainerScroll>
        <ol className="story-rail" aria-hidden>
          {STEPS.map((_, k) => (
            <li key={k} data-on={pos.free || k <= pos.step || undefined} data-current={(!pos.free && k === pos.step) || undefined} />
          ))}
        </ol>
      </div>
    </section>
  );
}
