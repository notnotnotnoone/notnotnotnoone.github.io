"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Zap } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

const PRESETS = [
  { name: "Groq", free: true },
  { name: "Google AI Studio", free: true },
  { name: "Mistral", free: true },
  { name: "Cerebras", free: true },
  { name: "OpenRouter", free: true },
  { name: "DeepSeek", free: false },
];

export function ProvidersScreen({ trigger }: ScreenProps) {
  const [picked, setPicked] = useState(false);
  const [key, setKey] = useState("");
  const [test, setTest] = useState(0);
  const [tested, setTested] = useState(false);
  const [keys, setKeys] = useState(1);

  useChoreo(trigger, [
    [300, () => setPicked(true)],
    [800, () => setKey("gsk_live_8Qx••••••••4f2a")],
    [1200, () => setTest(1)],
    [2800, () => setKeys(2)],
  ]);

  return (
    <>
      <Box title="Add a provider" sub="pick one, paste a key">
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="preset"
              data-picked={(p.name === "Groq" && picked) || undefined}
              onClick={() => p.name === "Groq" && setPicked(true)}
            >
              <span>{p.name}</span>
              <Tag tone={p.free ? "free" : "paid"}>{p.free ? "Free tier" : "Paid"}</Tag>
            </button>
          ))}
        </div>
      </Box>

      <AnimatePresence>
        {picked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Box title="Groq" sub="per account">
              <div className="row">
                <input
                  className="field flex-1"
                  aria-label="Groq key"
                  placeholder="Paste your key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <Button
                  kind="test"
                  icon={Zap}
                  label="Test key"
                  workingLabel="Testing"
                  doneLabel="Works"
                  trigger={test}
                  run={async () => {
                    await simulate({ ms: 800 });
                    setTested(true);
                  }}
                />
              </div>
              <div className="row">
                <span className="mono">key 1 · gsk_••••4f2a</span>
                <Pill status={tested ? "ready" : "off"} />
              </div>
              <AnimatePresence>
                {keys > 1 && (
                  <motion.div className="row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <span className="mono">key 2 · gsk_••••91c0</span>
                    <Pill status="ready" />
                  </motion.div>
                )}
              </AnimatePresence>
              {keys > 1 ? (
                <p className="hint">2 keys, used in turn. A key that hits its limit is skipped.</p>
              ) : (
                <Button kind="ghost" size="sm" icon={KeyRound} label="Add another key" onClick={() => setKeys(2)} />
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
