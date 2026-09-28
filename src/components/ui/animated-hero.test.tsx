import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MotionProvider } from "@/components/site/motion-provider";
import { Hero } from "./animated-hero";

function stubReducedMotion() {
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
}

describe("Hero", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it("ends visible (not stuck at opacity 0) under prefers-reduced-motion: reduce", async () => {
    stubReducedMotion();
    render(
      <MotionProvider>
        <Hero />
      </MotionProvider>,
    );

    const title = screen.getByRole("heading", { level: 1 });
    await waitFor(() => expect(title).toHaveStyle({ opacity: 1 }));

    const badge = screen.getByRole("link", { name: /flexrouter 2\.3/ });
    await waitFor(() => expect(badge.parentElement).toHaveStyle({ opacity: 1 }));
  });

  it("still enters (ends visible) with no motion preference", async () => {
    render(<Hero />);
    const title = screen.getByRole("heading", { level: 1 });
    await waitFor(() => expect(title).toHaveStyle({ opacity: 1 }), { timeout: 2000 });
  });
});
