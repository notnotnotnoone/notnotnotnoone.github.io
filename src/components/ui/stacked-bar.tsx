import * as React from "react";

export function segmentWidths(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  return values.map((v) => (v / total) * 100);
}

export type Segment = { label: string; value: number; color: string };

export function StackedBar({ segments }: { segments: Segment[] }) {
  const widths = segmentWidths(segments.map((s) => s.value));
  return (
    <div>
      <div className="stack" role="img" aria-label={segments.map((s) => `${s.label} ${s.value.toLocaleString("en-US")}`).join(", ")}>
        {segments.map((s, i) => (
          <i
            key={s.label}
            className="stack-seg"
            style={{ width: `${widths[i]}%`, background: s.color, "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
      <ul className="stack-key">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} aria-hidden />
            {s.label} <span className="text-ink-3">{s.value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
