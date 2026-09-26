import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Footer } from "./footer";
import { Nav } from "./nav";
import { SectionTitle } from "./section-title";

describe("Nav", () => {
  it("links home, to the quickstart and to GitHub", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "flexrouter home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Quickstart" })).toHaveAttribute("href", "/quickstart");
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/notnotnotnoone/flexrouter",
    );
  });

  describe("with prefers-reduced-motion: reduce", () => {
    const original = window.matchMedia;

    afterEach(() => {
      window.matchMedia = original;
    });

    it("still renders the scroll-progress line, driven directly by scroll (no spring)", () => {
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

      render(<Nav />);
      expect(screen.getByRole("link", { name: "flexrouter home" })).toBeInTheDocument();
    });
  });
});

describe("SectionTitle", () => {
  it("keeps the full text in the DOM for search engines and screen readers", () => {
    render(<SectionTitle>How it works</SectionTitle>);
    expect(screen.getByRole("heading", { level: 2, name: "How it works" })).toBeInTheDocument();
  });
});

describe("Footer", () => {
  it("names the licence", () => {
    render(<Footer />);
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });
});
