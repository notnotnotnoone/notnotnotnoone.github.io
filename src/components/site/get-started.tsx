"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button, ButtonLink } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { copyText } from "@/lib/copy";
import { GITHUB } from "@/lib/links";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

const INSTALL = "pip install git+https://github.com/notnotnotnoone/flexrouter";

const STEPS: { title: string; body: ReactNode }[] = [
  { title: "Install", body: <code>{INSTALL}</code> },
  {
    title: "Open the dashboard",
    body: (
      <>
        <code>flexrouter dashboard</code> starts it and opens your browser.
      </>
    ),
  },
  { title: "Add a free provider", body: "Pick one from the list and paste its key." },
  { title: "Add models, then test", body: "Press Add models with AI, then Test all." },
  {
    title: "Point your app at it",
    body: (
      <>
        Use <code>http://localhost:4891/v1</code> and a bucket name as the model.
      </>
    ),
  },
];

export function GetStarted() {
  const reduce = useReducedMotion();
  const cta = useRef<HTMLDivElement>(null);
  const ctaSeen = useInView(cta, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <section className="wrap section" id="start">
      <Reveal>
        <SectionTitle>Get started</SectionTitle>
        <p className="section-lead">About ten minutes. Everything after the install happens in the dashboard.</p>
      </Reveal>

      <ol className="start-list">
        <motion.span
          className="start-line"
          aria-hidden
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "0px 0px -20% 0px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {STEPS.map((s, i) => (
          <li key={s.title} className="start-step">
            <Reveal delay={i * 0.08}>
              <span className="start-num mono">{i + 1}</span>
              <div>
                <h3 className="start-title">{s.title}</h3>
                <p className="start-body">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          kind="copy"
          icon={Copy}
          label="Copy install command"
          doneLabel="Copied"
          run={async (source) => {
            if (source === "user") await copyText(INSTALL);
          }}
        />
        <ButtonLink kind="primary" href="/quickstart" icon={ArrowRight} label="Full quickstart" />
      </div>

      <div ref={cta} className="mt-24">
        <Box className="cta-band">
          <Meter value={ctaSeen ? 20 : 0} max={20} share label="Free usage available" />
          <h2 className="cta-title">Run your AI apps on free tiers.</h2>
          <div className="cta-row">
            <ButtonLink kind="primary" size="lg" href="/quickstart" icon={ArrowRight} label="Quickstart" />
            <ButtonLink kind="ghost" size="lg" href={GITHUB} external icon={ArrowUpRight} label="View on GitHub" />
          </div>
        </Box>
      </div>
    </section>
  );
}
