"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill } from "@/components/ui/pill";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { clock, KEY_SWITCH_AT, routeOne, START_LANES, type Lane, type Route } from "./traffic-logic";

type Row = Route & { n: number };

export function TrafficScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const lanesRef = useRef<Lane[]>(START_LANES);
  const n = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [lanes, setLanes] = useState<Lane[]>(START_LANES);
  const [rows, setRows] = useState<Row[]>([]);

  const tick = useCallback(() => {
    n.current += 1;
    const { lanes: next, route } = routeOne(lanesRef.current, n.current);
    lanesRef.current = next;
    setLanes(next);
    setRows((rs) => [{ ...route, n: n.current }, ...rs].slice(0, 6));
  }, []);

  const send = useCallback(
    (count: number) => {
      clearInterval(timer.current);
      let left = count;
      timer.current = setInterval(() => {
        tick();
        left -= 1;
        if (left <= 0) clearInterval(timer.current);
      }, 260);
    },
    [tick],
  );

  useEffect(() => () => clearInterval(timer.current), []);
  useChoreo(trigger, [[300, () => send(12)]]);

  const groq = lanes[0];
  const keyN = groq.used >= KEY_SWITCH_AT ? 2 : 1;

  return (
    <>
      <Box
        title="Bucket smart"
        sub="requests this minute"
        action={
          <Button
            kind="primary"
            size="sm"
            icon={Send}
            label="Send 10 requests"
            workingLabel="Sending"
            doneLabel="Sent"
            run={async () => {
              send(10);
              await simulate({ ms: 2700 });
            }}
          />
        }
      >
        {lanes.map((l, i) => {
          const full = l.used >= l.limit;
          return (
            <div key={l.id} className="row lane-row">
              <span className="mono lane-id">
                {l.id}
                {i === 0 && <span className="lane-key">key {keyN} of 2</span>}
              </span>
              <Meter value={l.used} max={l.limit} label={`${l.id} requests this minute`} />
              <span className="mono lane-n">
                {l.used}/{l.limit}
              </span>
              {full ? <Pill status="busy" countdown={42} /> : <Pill status="ready" />}
            </div>
          );
        })}
      </Box>

      <Box title="Last requests" sub="newest first" flush>
        {rows.length === 0 ? (
          <p className="empty">No requests yet.</p>
        ) : (
          <ul className="log">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.li
                  key={r.n}
                  className="log-row"
                  data-kind={r.kind}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, backgroundColor: "rgba(52,211,153,0.12)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="mono text-ink-4">{clock(r.n)}</span>
                  <span className="mono">smart</span>
                  <span className="mono log-path">
                    {r.kind === "failover" && (
                      <>
                        {r.from} → {r.to} <span className="text-blue">↻ failover</span>
                      </>
                    )}
                    {r.kind === "rotate" && (
                      <>
                        {r.to} · key 1 → key 2
                      </>
                    )}
                    {(r.kind === "ok" || r.kind === "none") && r.to}
                  </span>
                  <span className="mono text-ink-3">{r.ms ? `${r.ms.toLocaleString("en-US")} ms` : "-"}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Box>
    </>
  );
}
