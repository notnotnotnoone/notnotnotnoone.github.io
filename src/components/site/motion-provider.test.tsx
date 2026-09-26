import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Segmented } from "@/components/ui/segmented";
import { MiniDash } from "@/components/story/mini-dash";
import { MotionProvider } from "./motion-provider";

function stubReducedMotion() {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  return original;
}

describe("MotionProvider", () => {
  it("wraps children without altering them", () => {
    render(
      <MotionProvider>
        <p>content</p>
      </MotionProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  describe("under prefers-reduced-motion: reduce", () => {
    const original = window.matchMedia;

    afterEach(() => {
      window.matchMedia = original;
    });

    it("renders MiniDash's sliding marker without error", () => {
      stubReducedMotion();
      render(
        <MotionProvider>
          <MiniDash page="overview" available={new Set(["overview"])}>
            <p>screen</p>
          </MiniDash>
        </MotionProvider>,
      );
      expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    });

    it("renders Segmented's sliding highlight without error", () => {
      stubReducedMotion();
      render(
        <MotionProvider>
          <Segmented
            label="Rank by"
            value="a"
            onChange={() => {}}
            options={[
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ]}
          />
        </MotionProvider>,
      );
      expect(screen.getByRole("radio", { name: "A" })).toBeInTheDocument();
    });
  });
});
