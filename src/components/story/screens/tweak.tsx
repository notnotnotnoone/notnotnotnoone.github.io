"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Save, Trash2 } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { simulate } from "@/lib/sim";
import { DragBoard } from "../drag-board";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

type Cues = { drag: number; toggle: number; save: number; remove: number };

export function TweakScreen({ trigger }: ScreenProps) {
  const toast = useToast();
  const tries = useRef(0);
  const toastId = useRef(0);
  const [nvidia, setNvidia] = useState(false);
  const [giveUp, setGiveUp] = useState("30");
  const [saved, setSaved] = useState("30");
  const [removed, setRemoved] = useState(false);
  const [cue, setCue] = useState<Cues>({ drag: 0, toggle: 0, save: 0, remove: 0 });
  const bump = (k: keyof Cues) => setCue((s) => ({ ...s, [k]: s[k] + 1 }));
  const restore = useCallback(() => {
    setRemoved(false);
    // The row remounts fresh, and a stale non-zero trigger would fire its new
    // Remove button's effect again (see final-findings.md item 3). Reset it.
    setCue((s) => ({ ...s, remove: 0 }));
  }, []);

  useChoreo(trigger, [
    [300, () => bump("drag")],
    [1500, () => bump("toggle")],
    [2700, () => bump("toggle")],
    [3700, () => setGiveUp("45")],
    [4100, () => bump("save")],
    [5200, () => bump("remove")],
    [
      6900,
      () => {
        restore();
        toast.dismiss(toastId.current);
      },
    ],
  ]);

  return (
    <>
      <Box title="Buckets" sub="drag a model, or tap it and then a bucket">
        <DragBoard
          initial={{ smart: ["googleai/gemma-4-26b", "googleai/gemini-3.8-flash"], fast: ["groq/openai/gpt-oss-20b"] }}
          trigger={cue.drag}
          move={{ id: "googleai/gemma-4-26b", to: "fast" }}
        />
      </Box>

      <div className="tweak-grid">
        <Box title="Providers">
          <div className="row">
            <span className="flex items-center gap-3">
              <span className="mono">nvidia</span>
              <Pill status={nvidia ? "ready" : "off"} />
            </span>
            <Toggle
              label="nvidia"
              trigger={cue.toggle}
              onChange={setNvidia}
              save={async () => {
                tries.current += 1;
                await simulate({ ms: 400, fail: tries.current === 1, reason: "Couldn't save: the settings file is busy" });
              }}
            />
          </div>
        </Box>

        <Box title="Retries">
          <div className="row">
            <label className="flex items-center gap-2 text-sm">
              Give up after
              <input
                className="field w-16"
                inputMode="numeric"
                value={giveUp}
                onChange={(e) => setGiveUp(e.target.value.replace(/\D/g, ""))}
              />
              seconds
            </label>
            <Button
              kind="primary"
              icon={Save}
              label="Save"
              workingLabel="Saving"
              doneLabel="Saved"
              disabled={giveUp === saved}
              trigger={cue.save}
              run={async () => {
                await simulate({ ms: 600 });
                setSaved(giveUp);
              }}
            />
          </div>
        </Box>
      </div>

      <Box title="Models in fast" flush>
        <ul className="log">
          <AnimatePresence initial={false}>
            {!removed && (
              <motion.li
                key="ministral"
                className="row px-3.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="mono">mistral/ministral-3b-2512</span>
                <Button
                  kind="danger"
                  size="sm"
                  icon={Trash2}
                  label="Remove"
                  workingLabel="Removing"
                  trigger={cue.remove}
                  run={async () => {
                    await simulate({ ms: 400 });
                    setRemoved(true);
                    toastId.current = toast.push({
                      text: "Removed mistral/ministral-3b-2512",
                      action: { label: "Undo", onAction: restore },
                      ms: 6000,
                    });
                  }}
                />
              </motion.li>
            )}
          </AnimatePresence>
          <li className="row px-3.5">
            <span className="mono">groq/openai/gpt-oss-20b</span>
            <Pill status="ready" />
          </li>
        </ul>
      </Box>
    </>
  );
}
