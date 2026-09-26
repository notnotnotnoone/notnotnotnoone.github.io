import * as React from "react";

export function filledCells(value: number, max: number, cells = 20): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(cells, Math.round((value / max) * cells)));
}

export function meterTone(value: number, max: number): "ok" | "warn" | "bad" {
  const ratio = max <= 0 ? 0 : value / max;
  if (ratio >= 1) return "bad";
  if (ratio >= 0.8) return "warn";
  return "ok";
}

/** The dashboard's block meter. `share` means "compared with the busiest", so it never turns red. `wave` replays the good-news wave when it changes. */
export function Meter({
  value,
  max,
  cells = 20,
  share = false,
  wave = 0,
  label,
}: {
  value: number;
  max: number;
  cells?: number;
  share?: boolean;
  wave?: number;
  label?: string;
}) {
  const on = filledCells(value, max, cells);
  const tone = share ? "ok" : meterTone(value, max);
  return (
    <span
      key={wave}
      className="meter"
      data-tone={tone}
      data-wave={wave > 0 || undefined}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {Array.from({ length: cells }, (_, i) => (
        <i key={i} className="meter-cell" data-on={i < on || undefined} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </span>
  );
}
