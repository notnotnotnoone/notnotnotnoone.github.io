import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy classes and lets later Tailwind classes win", () => {
    expect(cn("px-2", false, "text-ink", "px-4")).toBe("text-ink px-4");
  });
});
