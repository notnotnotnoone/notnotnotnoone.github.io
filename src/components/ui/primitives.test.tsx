import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountUp } from "./count-up";
import { formatCountdown } from "./countdown";
import { filledCells, Meter, meterTone } from "./meter";
import { Pill, STATUS, type Status } from "./pill";
import { segmentWidths } from "./stacked-bar";

describe("meter maths", () => {
  it("fills cells in proportion and clamps", () => {
    expect(filledCells(0, 30)).toBe(0);
    expect(filledCells(15, 30)).toBe(10);
    expect(filledCells(45, 30)).toBe(20);
    expect(filledCells(3, 0)).toBe(0);
    expect(filledCells(1, 2, 10)).toBe(5);
  });
  it("turns warn at 80% and bad at 100%", () => {
    expect(meterTone(79, 100)).toBe("ok");
    expect(meterTone(80, 100)).toBe("warn");
    expect(meterTone(100, 100)).toBe("bad");
  });
  it("renders one cell per slot with the filled ones marked", () => {
    const { container } = render(<Meter value={5} max={10} cells={10} label="usage" />);
    expect(container.querySelectorAll(".meter-cell")).toHaveLength(10);
    expect(container.querySelectorAll(".meter-cell[data-on]")).toHaveLength(5);
    expect(screen.getByRole("meter", { name: "usage" })).toHaveAttribute("aria-valuenow", "5");
  });
});

describe("Pill", () => {
  it("always shows a glyph and a word", () => {
    const all: Status[] = ["ready", "busy", "struggling", "needs", "off"];
    for (const s of all) {
      const { unmount } = render(<Pill status={s} />);
      expect(screen.getByText(STATUS[s].glyph)).toBeInTheDocument();
      expect(screen.getByText(STATUS[s].word)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("formatCountdown", () => {
  it("formats seconds and minutes", () => {
    expect(formatCountdown(42)).toBe("back in 42s");
    expect(formatCountdown(125, "resets in")).toBe("resets in 2m 5s");
    expect(formatCountdown(0)).toBe("back now");
  });
});

describe("segmentWidths", () => {
  it("returns percentages that sum to 100", () => {
    expect(segmentWidths([1, 1, 2])).toEqual([25, 25, 50]);
    expect(segmentWidths([0, 0])).toEqual([0, 0]);
  });
});

describe("CountUp", () => {
  it("shows the final figure when not playing", () => {
    render(<CountUp to={32866} play={false} />);
    expect(screen.getByText("32,866")).toBeInTheDocument();
  });
});
