"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Fold } from "@/components/ui/fold";
import { Pill } from "@/components/ui/pill";
import { Sheet } from "@/components/ui/sheet";
import { copyText } from "@/lib/copy";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

const ROWS = [
  { id: "req_6565bd6b", time: "09:06:11", path: "groq → googleai", ms: "1,204 ms", failover: true },
  { id: "req_052290bd", time: "09:06:09", path: "groq · key 2", ms: "612 ms", failover: false },
  { id: "req_1f933a04", time: "09:06:05", path: "groq", ms: "480 ms", failover: false },
];

export function RequestScreen({ trigger }: ScreenProps) {
  const [open, setOpen] = useState(false);
  const [tried, setTried] = useState(0);
  const [think, setThink] = useState(0);
  const [copy, setCopy] = useState(0);

  useChoreo(trigger, [
    [400, () => setOpen(true)],
    [1100, () => setTried(1)],
    [1900, () => setThink(1)],
    [2700, () => setCopy(1)],
  ]);

  return (
    <>
      <Box title="Requests" sub="click one to see its journey" flush>
        <ul className="log">
          {ROWS.map((r) => (
            <li key={r.id}>
              <button type="button" className="log-row log-button" data-kind={r.failover ? "failover" : "ok"} onClick={() => setOpen(true)}>
                <span className="mono text-ink-4">{r.time}</span>
                <span className="mono">smart</span>
                <span className="mono log-path">
                  {r.path} {r.failover && <span className="text-blue">↻</span>}
                </span>
                <span className="mono text-ink-3">{r.ms}</span>
              </button>
            </li>
          ))}
        </ul>
      </Box>

      <Sheet open={open} onClose={() => setOpen(false)} title="Request req_6565bd6b">
        <div className="rq-line">
          <Pill status="ready" /> answered by <span className="mono">googleai/gemini-3.8-flash</span>
        </div>
        <div className="mono text-xs text-ink-3">smart · 1,204 ms · 82 in / 64 out · $0.00</div>
        <Fold summary="Tried first" note="1 attempt" trigger={tried}>
          <p className="rq-wait mono">
            groq/openai/gpt-oss-120b · 429 Rate limit reached for requests per minute · moved on at once, no waiting
          </p>
        </Fold>
        <div className="rq-convo">
          <p>
            <span className="label">you</span>
            Summarise this changelog in two lines.
          </p>
          <p>
            <span className="label">model</span>
            Failover no longer waits between tries. Errors now show the provider&apos;s own message and a request ID.
          </p>
        </div>
        <Fold summary="Thinking" note="312 tokens" trigger={think}>
          <p className="text-ink-3">Two lines. The changelog has two themes: faster failover and clearer errors.</p>
        </Fold>
        <Button
          kind="copy"
          icon={Copy}
          label="Copy request ID"
          doneLabel="Copied"
          trigger={copy}
          run={async (source) => {
            if (source === "user") await copyText("req_6565bd6b");
            else await simulate({ ms: 250 });
          }}
        />
      </Sheet>
    </>
  );
}
