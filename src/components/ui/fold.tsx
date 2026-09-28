"use client";

import * as React from "react";

export function Fold({
  summary,
  note,
  defaultOpen = false,
  trigger,
  children,
}: {
  summary: React.ReactNode;
  note?: React.ReactNode;
  defaultOpen?: boolean;
  trigger?: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const lastTrigger = React.useRef(0);

  React.useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (ref.current) ref.current.open = true;
  }, [trigger]);

  return (
    <details ref={ref} className="fold" open={defaultOpen || undefined}>
      <summary>
        {summary}
        {note && <span className="n">{note}</span>}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
