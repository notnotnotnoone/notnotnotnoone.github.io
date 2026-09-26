"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box } from "@/components/ui/box";
import { Meter } from "@/components/ui/meter";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

/** Set `src` to "/tour/<id>.png" once the 2.3 screenshots are in public/tour/. */
export const SHOTS: { id: string; label: string; caption: string; src: string | null }[] = [
  { id: "overview", label: "Overview", caption: "What the router has been doing: requests, answers, failovers and speed, hour by hour.", src: null },
  { id: "buckets", label: "Buckets", caption: "Each bucket's models in the order it would pick them, and which ones could answer right now.", src: null },
  { id: "allowance", label: "Allowance", caption: "Every provider's free allowance, how much is used, and when it resets.", src: null },
  { id: "status", label: "Status", caption: "Everything that needs you, in plain words, with a button that fixes it.", src: null },
  { id: "playground", label: "Playground", caption: "Send a real request through the router and see which model answered, and why.", src: null },
  { id: "settings", label: "Settings", caption: "Plain names for every setting, an app password, budget caps per provider, and backup and restore.", src: null },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="tour-ph">
      <span className="label">{label}</span>
      <Meter value={14} max={20} share />
      <Meter value={8} max={20} share />
      <Meter value={17} max={20} share />
      <span className="mono text-xs text-ink-4">Screenshot added when flexrouter 2.3 ships.</span>
    </div>
  );
}

export function DashboardTour() {
  const [cur, setCur] = useState(SHOTS[0].id);
  const reduce = useReducedMotion();
  const shot = SHOTS.find((s) => s.id === cur) ?? SHOTS[0];

  return (
    <section className="wrap section" id="tour">
      <Reveal>
        <SectionTitle>The dashboard</SectionTitle>
        <p className="section-lead">The same pages as in the story, on the real thing.</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="tour-tabs" role="tablist" aria-label="Dashboard pages">
          {SHOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tour-tab-${s.id}`}
              aria-selected={s.id === cur}
              aria-controls="tour-panel"
              className="tour-tab"
              onClick={() => setCur(s.id)}
            >
              {s.id === cur && <motion.span layoutId="tour-underline" className="tour-underline" />}
              {s.label}
            </button>
          ))}
        </div>
        <Box flush className="tour-frame">
          <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${cur}`}>
            <AnimatePresence initial={false}>
              <motion.figure
                key={cur}
                className="tour-fig"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {shot.src ? (
                  <Image src={shot.src} alt={`The ${shot.label} page`} width={1600} height={1000} className="tour-img" />
                ) : (
                  <Placeholder label={shot.label} />
                )}
                <figcaption>{shot.caption}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </Box>
      </Reveal>
    </section>
  );
}
