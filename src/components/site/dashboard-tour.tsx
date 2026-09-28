"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Box } from "@/components/ui/box";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

/** Screenshots of the flexrouter 2.3.0 dashboard with demo data, 1600x1000. */
export const SHOTS: { id: string; label: string; caption: string; src: string }[] = [
  { id: "overview", label: "Overview", caption: "What the router has been doing: requests, answers, failovers and speed, hour by hour.", src: "/tour/overview.png" },
  { id: "buckets", label: "Buckets", caption: "Each bucket's models in the order it would pick them, and which ones could answer right now.", src: "/tour/buckets.png" },
  { id: "allowance", label: "Allowance", caption: "Every provider's free allowance, how it is counted, and when it resets.", src: "/tour/allowance.png" },
  { id: "status", label: "Status", caption: "Everything that needs you, in plain words, with a button that fixes it.", src: "/tour/status.png" },
  { id: "playground", label: "Playground", caption: "Send a real request through the router and see which model answered, and why.", src: "/tour/playground.png" },
  { id: "settings", label: "Settings", caption: "Plain names for every setting, an app password, budget caps per provider, and backup and restore.", src: "/tour/settings.png" },
];

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={cur}
                className="tour-fig"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image src={shot.src} alt={`The ${shot.label} page`} width={1600} height={1000} className="tour-img" />
                <figcaption>{shot.caption}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </Box>
      </Reveal>
    </section>
  );
}
