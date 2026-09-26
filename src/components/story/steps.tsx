import type { ComponentType } from "react";
import type { PageId } from "./pages";

export type ScreenProps = { trigger: number };
export type StepDef = { narration: string; page: PageId; Screen: ComponentType<ScreenProps> };

function placeholder(name: string): ComponentType<ScreenProps> {
  function Placeholder() {
    return <p className="label">{name}</p>;
  }
  return Placeholder;
}

export const STEPS: StepDef[] = [
  { narration: "flexrouter, open for the first time.", page: "overview", Screen: placeholder("Welcome") },
  { narration: "Pick a free provider and paste a key.", page: "providers", Screen: placeholder("Providers") },
  { narration: "Let AI find the models and rank them.", page: "buckets", Screen: placeholder("Buckets") },
  { narration: "Check that every model answers.", page: "overview", Screen: placeholder("Test all") },
  {
    narration: "Send traffic. When a model runs out, the next one answers.",
    page: "requests",
    Screen: placeholder("Traffic"),
  },
  { narration: "Every request shows its whole journey.", page: "requests", Screen: placeholder("Request") },
  {
    narration: "When something breaks, it says why and offers the fix.",
    page: "status",
    Screen: placeholder("Status"),
  },
  { narration: "Change anything by hand.", page: "settings", Screen: placeholder("Tweak") },
  { narration: "See how much free usage is left today.", page: "allowance", Screen: placeholder("Allowance") },
];
