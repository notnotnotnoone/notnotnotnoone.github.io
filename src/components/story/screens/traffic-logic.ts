export type Lane = { id: string; used: number; limit: number };
export type Route = { kind: "ok" | "rotate" | "failover" | "none"; from?: string; to: string; ms: number };

/** Requests per minute, per model, in bucket "smart". groq's key 1 is used up at 27; key 2 carries it to 30. */
export const START_LANES: Lane[] = [
  { id: "groq/openai/gpt-oss-120b", used: 24, limit: 30 },
  { id: "googleai/gemini-3.8-flash", used: 6, limit: 60 },
  { id: "mistral/mistral-medium-latest", used: 3, limit: 60 },
];
export const KEY_SWITCH_AT = 27;

const provider = (id: string) => id.split("/")[0];

export function routeOne(lanes: Lane[], n: number): { lanes: Lane[]; route: Route } {
  const i = lanes.findIndex((l) => l.used < l.limit);
  const ms = 380 + ((n * 137) % 900);
  if (i === -1) return { lanes, route: { kind: "none", to: "nothing answered", ms: 0 } };
  const next = lanes.map((l, k) => (k === i ? { ...l, used: l.used + 1 } : l));
  if (i > 0) {
    return { lanes: next, route: { kind: "failover", from: provider(lanes[0].id), to: provider(lanes[i].id), ms } };
  }
  if (next[0].used === KEY_SWITCH_AT) return { lanes: next, route: { kind: "rotate", to: provider(lanes[0].id), ms } };
  return { lanes: next, route: { kind: "ok", to: provider(lanes[0].id), ms } };
}

export function clock(n: number): string {
  return `09:06:${String(10 + n).padStart(2, "0")}`;
}
