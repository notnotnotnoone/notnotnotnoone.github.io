import type { Status } from "@/components/ui/pill";

export type StatusRow = {
  id: string;
  status: Status;
  reason: string;
  fix: string;
  brain?: { verdict: string; sure: number };
  gone?: boolean;
};

export const START_ROWS: StatusRow[] = [
  {
    id: "mistral/mistral-large-2512",
    status: "needs",
    reason: "Not on your Mistral plan.",
    fix: "Use mistral-small instead",
    brain: { verdict: "not on your plan", sure: 92 },
  },
  {
    id: "googleai/gemma-4-31b-it",
    status: "struggling",
    reason: "Slow replies: 31 s median.",
    fix: "Retry",
  },
];
export const START_READY = 4;

export function counts(rows: StatusRow[], extraReady: number): Record<Status, number> {
  const c: Record<Status, number> = { ready: extraReady, busy: 0, struggling: 0, needs: 0, off: 0 };
  for (const r of rows) c[r.status] += 1;
  return c;
}

export function settle(rows: StatusRow[], id: string): StatusRow[] {
  return rows.map((r) => (r.id === id ? { ...r, status: "ready" } : r));
}

export function retire(rows: StatusRow[], id: string): StatusRow[] {
  return rows.map((r) => (r.id === id ? { ...r, gone: true } : r));
}
