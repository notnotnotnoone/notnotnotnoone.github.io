"use client";

import { useState } from "react";
import { Copy, Zap } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill } from "@/components/ui/pill";
import { copyText } from "@/lib/copy";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { FOUND } from "./buckets-logic";
import { GetStartedCard } from "./get-started-card";

export const CURL = `curl http://localhost:4891/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "smart", "messages": [{"role": "user", "content": "hi"}]}'`;

export function TestAllScreen({ trigger }: ScreenProps) {
  const [tested, setTested] = useState(0);
  const [wave, setWave] = useState(0);
  const [done, setDone] = useState(3);
  const [celebrate, setCelebrate] = useState(false);
  const [test, setTest] = useState(0);
  const [copy, setCopy] = useState(0);

  useChoreo(trigger, [
    [300, () => setTest(1)],
    [2600, () => setCopy(1)],
  ]);

  return (
    <>
      <GetStartedCard done={done} celebrate={celebrate} />
      <Box
        title="Test all"
        sub="says hi to every model once, about 512 tokens"
        action={
          <Button
            kind="test"
            icon={Zap}
            label="Test all"
            workingLabel={`Testing ${tested} of ${FOUND.length}`}
            doneLabel={`All ${FOUND.length} work`}
            trigger={test}
            run={async () => {
              setTested(0);
              for (let i = 1; i <= FOUND.length; i++) {
                await simulate({ ms: 180 });
                setTested(i);
              }
              setWave((w) => w + 1);
              setDone((d) => Math.max(d, 4));
            }}
          />
        }
      >
        <Meter value={tested} max={FOUND.length} cells={18} wave={wave} label="Models tested" />
        <ul className="test-list">
          {FOUND.map((m, i) => (
            <li key={m.id}>
              <span className="mono">{m.id}</span>
              {i < tested ? <Pill status="ready" /> : <span className="text-ink-4 mono text-xs">not tested</span>}
            </li>
          ))}
        </ul>
      </Box>
      <Box
        title="Point your app at it"
        action={
          <Button
            kind="copy"
            icon={Copy}
            label="Copy curl"
            doneLabel="Copied"
            trigger={copy}
            run={async (source) => {
              if (source === "user") await copyText(CURL);
              else await simulate({ ms: 250 });
              setDone(5);
              setCelebrate(true);
            }}
          />
        }
      >
        <pre className="code-line">
          <code>{CURL}</code>
        </pre>
      </Box>
    </>
  );
}
