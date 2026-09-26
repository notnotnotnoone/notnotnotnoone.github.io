"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsClient } from "@/lib/use-media";

/** "// Title" that types itself in once, then leaves a blinking block caret. The real text stays in the DOM. */
export function SectionTitle({ children, id }: { children: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const client = useIsClient();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => {
      setN((v) => {
        if (v >= children.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 32);
    return () => clearInterval(id);
  }, [inView, reduce, children]);

  const typing = client && !reduce;
  return (
    <h2 ref={ref} id={id} className="section-title" data-typing={typing || undefined}>
      <span className="slashes" aria-hidden>
        {"//"}
      </span>
      <span className="type-wrap">
        <span className="type-ghost">{children}</span>
        {typing && (
          <span className="type-live" aria-hidden>
            {children.slice(0, n)}
            <span className="caret" />
          </span>
        )}
      </span>
    </h2>
  );
}
