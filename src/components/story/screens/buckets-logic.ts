export type Found = { id: string; score: number; tps: number };
export type Mode = "smartest" | "fastest";

/** What "Add models with AI" finds, in the order it finds them. */
export const FOUND: Found[] = [
  { id: "mistral/mistral-medium-latest", score: 78, tps: 95 },
  { id: "googleai/gemini-3.8-flash", score: 95, tps: 140 },
  { id: "groq/openai/gpt-oss-120b", score: 85, tps: 177 },
  { id: "groq/qwen/qwen3.8-27b", score: 80, tps: 310 },
  { id: "googleai/gemini-3.5-flash-lite", score: 80, tps: 337 },
  { id: "mistral/ministral-8b-2512", score: 65, tps: 220 },
];

const keyOf = (mode: Mode) => (mode === "smartest" ? "score" : "tps");

export function orderModels(models: Found[], ranked: boolean, mode: Mode): Found[] {
  if (!ranked) return models;
  const k = keyOf(mode);
  return [...models].sort((a, b) => b[k] - a[k]);
}

/** The models a request could go to: within 20% of the best. */
export function answering(ordered: Found[], mode: Mode): Set<string> {
  if (!ordered.length) return new Set();
  const k = keyOf(mode);
  const best = Math.max(...ordered.map((m) => m[k]));
  return new Set(ordered.filter((m) => m[k] >= best * 0.8).map((m) => m.id));
}

/** Positive = moved up since it was found. */
export function movement(id: string, ordered: Found[]): number {
  return FOUND.findIndex((m) => m.id === id) - ordered.findIndex((m) => m.id === id);
}
