import type { ComponentType } from "react";
import type { PageId } from "./pages";
import { AllowanceScreen } from "./screens/allowance";
import { BucketsScreen } from "./screens/buckets";
import { WelcomeScreen } from "./screens/get-started-card";
import { ProvidersScreen } from "./screens/providers";
import { RequestScreen } from "./screens/request";
import { StatusScreen } from "./screens/status";
import { TestAllScreen } from "./screens/test-all";
import { TrafficScreen } from "./screens/traffic";
import { TweakScreen } from "./screens/tweak";

export type ScreenProps = { trigger: number };
export type StepDef = { narration: string; page: PageId; Screen: ComponentType<ScreenProps> };

export const STEPS: StepDef[] = [
  { narration: "flexrouter, open for the first time.", page: "overview", Screen: WelcomeScreen },
  { narration: "Pick a free provider and paste a key.", page: "providers", Screen: ProvidersScreen },
  { narration: "Let AI find the models and rank them.", page: "buckets", Screen: BucketsScreen },
  { narration: "Check that every model answers.", page: "overview", Screen: TestAllScreen },
  { narration: "Send traffic. When a model runs out, the next one answers.", page: "requests", Screen: TrafficScreen },
  { narration: "Every request shows its whole journey.", page: "requests", Screen: RequestScreen },
  { narration: "When something breaks, it says why and offers the fix.", page: "status", Screen: StatusScreen },
  { narration: "Change anything by hand.", page: "settings", Screen: TweakScreen },
  { narration: "See how much free usage is left today.", page: "allowance", Screen: AllowanceScreen },
];
