import { Countdown } from "./countdown";

export type Status = "ready" | "busy" | "struggling" | "needs" | "off";

export const STATUS: Record<Status, { glyph: string; word: string }> = {
  ready: { glyph: "●", word: "Ready" },
  busy: { glyph: "◐", word: "Busy" },
  struggling: { glyph: "◆", word: "Struggling" },
  needs: { glyph: "▲", word: "Needs you" },
  off: { glyph: "○", word: "Off" },
};

export function Pill({ status, countdown }: { status: Status; countdown?: number }) {
  return (
    <span className="pill" data-status={status}>
      <span className="pill-dot" aria-hidden>
        {STATUS[status].glyph}
      </span>
      <span className="pill-word">{STATUS[status].word}</span>
      {countdown !== undefined && <Countdown seconds={countdown} />}
    </span>
  );
}
