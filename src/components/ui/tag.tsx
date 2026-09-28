import * as React from "react";

export type TagTone = "free" | "paid" | "limit" | "provider" | "muted";

export function Tag({ tone = "muted", children }: { tone?: TagTone; children: React.ReactNode }) {
  return (
    <span className="tag" data-tone={tone}>
      {children}
    </span>
  );
}
