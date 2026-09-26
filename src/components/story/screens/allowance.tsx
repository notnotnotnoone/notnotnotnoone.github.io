"use client";

import { Box } from "@/components/ui/box";
import { CountUp } from "@/components/ui/count-up";
import { Countdown } from "@/components/ui/countdown";
import { Fold } from "@/components/ui/fold";
import { Meter } from "@/components/ui/meter";
import { StackedBar } from "@/components/ui/stacked-bar";
import { Tag } from "@/components/ui/tag";
import type { ScreenProps } from "../steps";

type Limit =
  | { model: string; what: string; used: number; limit: number; src: "Your limit"; resets: number }
  | { model: string; what: string; left: string; src: string; resets: number };

function LimitRow({ l }: { l: Limit }) {
  return (
    <div className="lim-row">
      <div className="lim-name">
        <span className="mono">{l.model}</span>
        <span className="label">{l.what}</span>
      </div>
      <Tag tone={l.src === "Your limit" ? "limit" : "provider"}>{l.src}</Tag>
      {"limit" in l ? (
        <span className="lim-meter">
          <Meter value={l.used} max={l.limit} label={`${l.model} ${l.what}`} />
          <span className="mono text-xs text-ink-3">
            {(l.limit - l.used).toLocaleString("en-US")} left · <Countdown seconds={l.resets} prefix="resets in" />
          </span>
        </span>
      ) : (
        <span className="mono text-xs text-ink-3">
          {l.left} · <Countdown seconds={l.resets} prefix="resets in" />
        </span>
      )}
    </div>
  );
}

export function AllowanceScreen({ trigger }: ScreenProps) {
  return (
    <>
      <Box title="Free requests left today" sub="only daily limits you've set are counted">
        <div className="allow-big">
          <CountUp to={32866} play={trigger > 0} className="allow-n" />
          <span>free requests left today across 3 providers</span>
        </div>
        <StackedBar
          segments={[
            { label: "googleai", value: 29881, color: "var(--color-green)" },
            { label: "groq", value: 1735, color: "var(--color-blue)" },
            { label: "mistral", value: 1250, color: "var(--color-violet)" },
          ]}
        />
      </Box>

      <div className="tweak-grid">
        <Box title="googleai" sub="1 key">
          <LimitRow l={{ model: "gemini-3.8-flash", what: "Requests per day", used: 3, limit: 20, src: "Your limit", resets: 5400 }} />
          <Fold summary="3 more limits">
            <LimitRow l={{ model: "gemini-3.7-flash", what: "Requests per day", used: 4, limit: 20, src: "Your limit", resets: 5400 }} />
            <LimitRow l={{ model: "gemma-4-31b-it", what: "Requests per day", used: 2, limit: 14400, src: "Your limit", resets: 5400 }} />
            <LimitRow l={{ model: "gemini-3.1-flash-lite", what: "Requests per day", used: 16, limit: 20, src: "Your limit", resets: 5400 }} />
          </Fold>
        </Box>
        <Box title="groq" sub="2 keys">
          <LimitRow l={{ model: "openai/gpt-oss-120b", what: "Tokens", left: "7,728 left", src: "Groq says", resets: 42 }} />
          <LimitRow l={{ model: "openai/gpt-oss-120b", what: "Requests per day", used: 6, limit: 1000, src: "Your limit", resets: 5400 }} />
        </Box>
      </div>
    </>
  );
}
