import * as React from "react";
import { Check } from "lucide-react";
import { Box } from "@/components/ui/box";
import { cn } from "@/lib/utils";

export const GS_TASKS = [
  "Add a provider",
  "Paste its key",
  "Add models with AI",
  "Test all",
  "Point your app at localhost:4891/v1",
];

export function GetStartedCard({ done, celebrate = false }: { done: number; celebrate?: boolean }) {
  return (
    <Box title="Get started" sub={`${done} of 5 done`} className={cn("gs", celebrate && "gs-complete")}>
      <ol className="gs-list">
        {GS_TASKS.map((t, i) => (
          <li key={t} className="gs-item" data-done={i < done || undefined} style={{ "--i": i } as React.CSSProperties}>
            <span className="gs-tick" aria-hidden>
              {i < done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </Box>
  );
}

export function WelcomeScreen() {
  return (
    <>
      <GetStartedCard done={0} />
      <p className="hint">Shown on first start, and again whenever no model works. Each step ticks itself.</p>
    </>
  );
}
