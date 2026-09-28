"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { ListOrdered, Sparkles } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Segmented } from "@/components/ui/segmented";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { answering, FOUND, movement, orderModels, type Found, type Mode } from "./buckets-logic";

export function BucketsScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const [models, setModels] = useState<Found[]>([]);
  const [ranked, setRanked] = useState(false);
  const [mode, setMode] = useState<Mode>("smartest");
  const [add, setAdd] = useState(0);
  const [rank, setRank] = useState(0);

  useChoreo(trigger, [
    [300, () => setAdd(1)],
    [1700, () => setRank(1)],
    [3300, () => setMode("fastest")],
    [4700, () => setMode("smartest")],
  ]);

  const ordered = orderModels(models, ranked, mode);
  const live = answering(ordered, mode);
  const k = mode === "smartest" ? "score" : "tps";
  const best = ordered.length ? Math.max(...ordered.map((m) => m[k])) : 1;

  return (
    <>
      <div className="row-actions">
        <Button
          kind="primary"
          icon={Sparkles}
          label="Add models with AI"
          workingLabel="Looking"
          doneLabel={`Added ${FOUND.length}`}
          trigger={add}
          run={async () => {
            await simulate({ ms: 900 });
            setModels(FOUND);
          }}
        />
        <Button
          kind="test"
          icon={ListOrdered}
          label="Rank models with AI"
          workingLabel="Ranking"
          doneLabel="Ranked"
          trigger={rank}
          disabled={!models.length}
          run={async () => {
            await simulate({ ms: 900 });
            setRanked(true);
          }}
        />
      </div>

      <Box
        title="smart"
        sub={models.length ? `${models.length} models · ${live.size} could answer now` : "no models yet"}
        action={
          <Segmented
            label="Rank by"
            value={mode}
            onChange={setMode}
            options={[
              { value: "smartest", label: "Smartest" },
              { value: "fastest", label: "Fastest" },
            ]}
          />
        }
        flush
      >
        {models.length === 0 ? (
          <p className="empty">No models yet. Add some with AI.</p>
        ) : (
          <LayoutGroup id="ladder">
            <ol className="ladder">
              {ordered.map((m, i) => {
                const mv = ranked ? movement(m.id, ordered) : 0;
                const on = live.has(m.id);
                return (
                  <motion.li
                    key={m.id}
                    layout={!reduce}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="ladder-row"
                    data-live={on || undefined}
                  >
                    <span className="ladder-n">{i + 1}</span>
                    <span className="ladder-id mono">
                      {m.id}
                      {mv !== 0 && (
                        <span className="move" data-dir={mv > 0 ? "up" : "down"}>
                          {mv > 0 ? `▲${mv}` : `▼${-mv}`}
                        </span>
                      )}
                    </span>
                    <Meter value={m[k]} max={best} cells={10} share />
                    <span className="ladder-v mono">{k === "score" ? m[k] : `${m[k]} t/s`}</span>
                    <span className="ladder-state">{on ? "would answer" : "outranked"}</span>
                  </motion.li>
                );
              })}
            </ol>
          </LayoutGroup>
        )}
      </Box>
      <p className="hint">A request goes to a random model within 20% of the best one that can answer, so the load spreads out.</p>
    </>
  );
}
