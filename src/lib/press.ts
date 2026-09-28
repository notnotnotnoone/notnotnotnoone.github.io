export type PressState = "idle" | "working" | "done" | "failed";
export type PressEvent = "start" | "ok" | "fail" | "reset";
export type PressSource = "user" | "trigger";

export function nextPress(state: PressState, event: PressEvent): PressState {
  if (event === "reset") return "idle";
  if (event === "start") return "working";
  if (state !== "working") return state;
  return event === "ok" ? "done" : "failed";
}
