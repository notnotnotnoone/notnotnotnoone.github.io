"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill, STATUS } from "@/components/ui/pill";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { counts, retire, settle, START_READY, START_ROWS } from "./status-logic";

type Fly = { key: number; x: number; y: number; dx: number; dy: number };

export function StatusScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState(START_ROWS);
  const [fix, setFix] = useState(0);
  const [retry, setRetry] = useState(0);
  const [fly, setFly] = useState<Fly | null>(null);
  const [pop, setPop] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLSpanElement>(null);
  const pills = useRef<Record<string, HTMLSpanElement | null>>({});
  const flights = useRef(0);

  useChoreo(trigger, [
    [600, () => setFix(1)],
    [2800, () => setRetry(1)],
  ]);

  const c = counts(rows, START_READY);

  const settleRow = (id: string) => {
    const from = pills.current[id];
    const to = chip.current;
    const box = wrap.current;
    if (from && to && box && !reduce) {
      const b = box.getBoundingClientRect();
      const scale = b.width / box.offsetWidth || 1; // the story card may be scaled
      const f = from.getBoundingClientRect();
      const t = to.getBoundingClientRect();
      flights.current += 1;
      setFly({
        key: flights.current,
        x: (f.left - b.left) / scale,
        y: (f.top - b.top) / scale,
        dx: (t.left - f.left) / scale,
        dy: (t.top - f.top) / scale,
      });
    }
    setRows((rs) => settle(rs, id));
    setTimeout(() => setPop((p) => p + 1), reduce ? 0 : 520);
    setTimeout(() => setRows((rs) => retire(rs, id)), 1100);
  };

  return (
    <div ref={wrap} className="st">
      <div className="st-chips" aria-label="Summary">
        {(["ready", "struggling", "needs"] as const).map((s) => (
          <span key={s} className="st-chip" data-status={s} ref={s === "ready" ? chip : undefined}>
            <span aria-hidden>{STATUS[s].glyph}</span>
            <motion.span
              key={s === "ready" ? pop : 0}
              className="st-n"
              initial={s === "ready" && pop > 0 && !reduce ? { scale: 1.6, color: "#6ee7b7" } : false}
              animate={{ scale: 1, color: "currentColor" }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              {c[s]}
            </motion.span>
            {STATUS[s].word.toLowerCase()}
          </span>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {rows
          .filter((r) => !r.gone)
          .map((r) => (
            <motion.div
              key={r.id}
              layout={!reduce}
              className="st-row"
              data-status={r.status}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                ref={(el) => {
                  pills.current[r.id] = el;
                }}
              >
                <Pill key={r.status} status={r.status} />
              </span>
              <div className="st-main">
                <span className="mono">{r.id}</span>
                <span className="st-reason">{r.reason}</span>
                {r.brain && (
                  <span className="st-brain">
                    Error brain: {r.brain.verdict}, {r.brain.sure}% sure
                    <Meter value={r.brain.sure} max={100} cells={10} share label="Error brain confidence" />
                  </span>
                )}
              </div>
              <Button
                kind="fix"
                icon={r.fix === "Retry" ? RefreshCw : Wrench}
                label={r.fix}
                workingLabel={r.fix === "Retry" ? "Retrying" : "Switching"}
                doneLabel={r.fix === "Retry" ? "Answered" : "Fixed"}
                trigger={r.status === "needs" ? fix : r.status === "struggling" ? retry : 0}
                run={async () => {
                  await simulate({ ms: 900 });
                  settleRow(r.id);
                }}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {c.needs === 0 && (
          <motion.div
            className="st-clear"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <svg viewBox="0 0 24 24" className="st-clear-tick" aria-hidden>
              <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" pathLength={1} />
            </svg>
            Nothing needs you.
          </motion.div>
        )}
      </AnimatePresence>

      {fly && (
        <motion.span
          key={fly.key}
          className="st-fly"
          style={{ left: fly.x, top: fly.y }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: fly.dx, y: fly.dy, scale: 0.6, opacity: [1, 1, 0] }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          onAnimationComplete={() => setFly(null)}
          aria-hidden
        />
      )}
    </div>
  );
}
