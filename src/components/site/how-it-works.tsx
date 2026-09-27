import type { ReactNode } from "react";
import { Box } from "@/components/ui/box";
import { Meter } from "@/components/ui/meter";
import { Pill, type Status } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

export const EXPLAINERS: { title: string; text: string }[] = [
  {
    title: "Buckets",
    text: "Your app asks for a bucket like smart or fast, never a model name. Each bucket ranks its models by score or by speed, then picks at random among the ones within 20% of the best that can answer, so the load spreads out.",
  },
  {
    title: "Failover",
    text: "When a model is rate-limited, down or broken, the next one answers straight away, with no waiting between tries. A request pinned to one model reports the failure instead of switching, so you always know which model answered.",
  },
  {
    title: "Several keys per provider",
    text: "Add more than one key for a provider and they are used in turn. A key that hits its limit is skipped until it resets. Keys live in their own file, never in your settings file.",
  },
  {
    title: "Statuses and the error brain",
    text: "Every model and key has one status: Ready, Busy, Struggling, Needs you or Off. Errors are explained in plain words. The error brain sorts each new error, says how sure it is, and asks you to check when it isn't.",
  },
  {
    title: "Allowance",
    text: "See what is left of every free allowance today and when each limit resets. Limits you set are marked as yours. Numbers the provider reports carry the provider's name.",
  },
  {
    title: "Setup with AI",
    text: "Pick a provider from the list, marked free or paid, and paste a key. Add models with AI finds the models the key can use, Get rate limits with AI fills in their limits, and Rank with AI puts them in order.",
  },
];

const ALL: Status[] = ["ready", "busy", "struggling", "needs", "off"];

const VISUALS: ReactNode[] = [
  <div key="b" className="hiw-vis">
    {[95, 85, 78].map((v, i) => (
      <div key={v} className="hiw-line">
        <span className="mono">{["gemini-3.8-flash", "gpt-oss-120b", "mistral-medium"][i]}</span>
        <Meter value={v} max={95} cells={10} share />
      </div>
    ))}
  </div>,
  <div key="f" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>groq</span>
      <Pill status="busy" />
    </div>
    <div className="hiw-line">
      <span>
        groq → googleai <span className="text-blue">↻</span>
      </span>
      <Pill status="ready" />
    </div>
  </div>,
  <div key="k" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>groq · key 1</span>
      <Pill status="busy" />
    </div>
    <div className="hiw-line">
      <span>groq · key 2</span>
      <Pill status="ready" />
    </div>
  </div>,
  <div key="s" className="hiw-vis hiw-pills">
    {ALL.map((s) => (
      <Pill key={s} status={s} />
    ))}
  </div>,
  <div key="a" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>gemini-3.8-flash</span>
      <Tag tone="limit">Your limit</Tag>
    </div>
    <Meter value={3} max={20} />
    <div className="hiw-line">
      <span>7,728 tokens left</span>
      <Tag tone="provider">Groq says</Tag>
    </div>
  </div>,
  <div key="ai" className="hiw-vis hiw-pills">
    <Tag tone="free">Free tier</Tag>
    <Tag tone="free">Free tier</Tag>
    <Tag tone="paid">Paid</Tag>
  </div>,
];

export function HowItWorks() {
  return (
    <section className="wrap section" id="how">
      <Reveal>
        <SectionTitle>How it works</SectionTitle>
      </Reveal>
      <div className="hiw-grid">
        {EXPLAINERS.map((e, i) => (
          <Reveal key={e.title} delay={(i % 4) * 0.06}>
            <Box lift className="hiw-card">
              <span className="hiw-num mono">0{i + 1}</span>
              <h3 className="hiw-title">{e.title}</h3>
              <p>{e.text}</p>
              {VISUALS[i]}
            </Box>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
