import { describe, expect, it } from "vitest";
import { nextPress } from "./press";

describe("nextPress", () => {
  it("goes idle -> working -> done -> idle", () => {
    expect(nextPress("idle", "start")).toBe("working");
    expect(nextPress("working", "ok")).toBe("done");
    expect(nextPress("done", "reset")).toBe("idle");
  });
  it("goes working -> failed", () => {
    expect(nextPress("working", "fail")).toBe("failed");
  });
  it("ignores ok and fail unless working", () => {
    expect(nextPress("idle", "ok")).toBe("idle");
    expect(nextPress("done", "fail")).toBe("done");
  });
  it("can start again from failed", () => {
    expect(nextPress("failed", "start")).toBe("working");
  });
});
