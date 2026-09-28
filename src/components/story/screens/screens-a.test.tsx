import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { answering, FOUND, movement, orderModels } from "./buckets-logic";
import { GetStartedCard } from "./get-started-card";
import { ProvidersScreen } from "./providers";

describe("bucket ordering", () => {
  it("leaves the found order alone until ranked", () => {
    expect(orderModels(FOUND, false, "smartest")).toEqual(FOUND);
  });
  it("ranks by score or by speed", () => {
    expect(orderModels(FOUND, true, "smartest")[0].id).toBe("googleai/gemini-3.8-flash");
    expect(orderModels(FOUND, true, "fastest")[0].id).toBe("googleai/gemini-3.5-flash-lite");
  });
  it("marks the models within 20% of the best as able to answer", () => {
    expect(answering(orderModels(FOUND, true, "smartest"), "smartest").size).toBe(5);
    expect(answering(orderModels(FOUND, true, "fastest"), "fastest").size).toBe(2);
  });
  it("reports how far a model moved when ranked", () => {
    const ranked = orderModels(FOUND, true, "smartest");
    expect(movement("googleai/gemini-3.8-flash", ranked)).toBe(1);
    expect(movement("mistral/mistral-medium-latest", ranked)).toBe(-4);
  });
});

describe("GetStartedCard", () => {
  it("counts and ticks finished tasks", () => {
    const { container } = render(<GetStartedCard done={2} />);
    expect(screen.getByText("2 of 5 done")).toBeInTheDocument();
    expect(container.querySelectorAll(".gs-item[data-done]")).toHaveLength(2);
  });
});

describe("ProvidersScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is interactive in free play", () => {
    render(<ProvidersScreen trigger={0} />);
    expect(screen.queryByLabelText("Groq key")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Groq/ }));
    expect(screen.getByLabelText("Groq key")).toBeInTheDocument();
  });

  it("plays: pick Groq, test the key, add a second key", async () => {
    render(<ProvidersScreen trigger={1} />);
    // Advance in small chunks rather than one big jump: a single large
    // advanceTimersByTimeAsync doesn't reliably pick up a setTimeout that a
    // React effect schedules in reaction to an earlier fake timer firing
    // (a known fake-timers/jsdom interaction), so we give it more chances
    // to notice the newly scheduled timer along the way.
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }
    expect(screen.getByText("2 keys, used in turn. A key that hits its limit is skipped.")).toBeInTheDocument();
    expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(2);
  });
});
