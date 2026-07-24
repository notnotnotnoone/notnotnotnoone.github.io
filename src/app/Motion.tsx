"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import type { gsap as GsapType } from "gsap";

export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = document.querySelector("nav");

    // Reduced motion: CSS media query already reveals everything. Just wire the
    // nav-depth shadow and bail on smooth-scroll + entrance animation.
    if (reduce) {
      const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Guard against Strict Mode's double-invoke: the async imports resolve after
    // the first cleanup fires, so bail if unmounted. Keep every resource in outer
    // scope so the single cleanup owns them.
    let cancelled = false;
    let lenis: Lenis | null = null;
    let ticker: ((time: number) => void) | null = null;
    let gsapRef: typeof GsapType | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweens: any[] = [];

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsapRef = gsap;
      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", () => nav?.classList.toggle("scrolled", window.scrollY > 8));
      ticker = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      // page-top entrance (hero on home, header on quickstart)
      const topEls = gsap.utils.toArray<HTMLElement>(
        ".hero .eyebrow, .hero h1, .hero-sub, .hero .cta-row, .code-card, .qs header"
      );
      if (topEls.length) {
        tweens.push(
          gsap.to(topEls, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.09,
            delay: 0.05,
          })
        );
      }

      const reveal = (sel: string, extra: gsap.TweenVars = {}) =>
        gsap.utils.toArray<HTMLElement>(sel).forEach((el) => {
          tweens.push(
            gsap.to(el, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: "power3.out",
              ...extra,
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            })
          );
        });

      reveal(".sec-head");
      reveal(".flag");
      reveal(".engine-bar");
      reveal(".panel");
      reveal(".agora-card");
      reveal(".claim");
      reveal(".step");
      reveal(".free");
      reveal(".closer");

      // staggered groups
      const groups: [string, string][] = [
        [".pnp-grid", ".pnp"],
        [".spokes", ".spoke"],
        [".proj-grid", ".proj"],
      ];
      groups.forEach(([wrap, item]) => {
        const items = gsap.utils.toArray<HTMLElement>(item);
        if (!items.length) return;
        tweens.push(
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: wrap, start: "top 82%", once: true },
          })
        );
      });

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      // Kill tweens + their ScrollTriggers, but never revert styles — a stray
      // teardown must leave elements visible, not snap them back to hidden.
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      if (gsapRef && ticker) gsapRef.ticker.remove(ticker);
      try {
        lenis?.destroy();
      } catch {}
    };
  }, []);

  return null;
}
