"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { PAGES, type PageId } from "./pages";

export function MiniDash({
  page,
  available,
  onPick,
  children,
}: {
  page: PageId;
  /** Pages that have a screen; only these can be picked in free play. */
  available?: ReadonlySet<PageId>;
  onPick?: (page: PageId) => void;
  children: React.ReactNode;
}) {
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  const groups = ["The router", "Traffic", "System"] as const;

  return (
    <div className="mini-dash">
      <nav className="md-side" aria-label="Dashboard pages">
        <div className="md-brand">
          <Logo size="sm" />
        </div>
        {groups.map((g) => (
          <div key={g} className="md-group">
            <span className="label">{g}</span>
            <ul>
              {PAGES.filter((p) => p.group === g).map((p) => {
                const live = !!onPick && !!available?.has(p.id);
                const isCurrent = p.id === page;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="md-item"
                      data-current={isCurrent || undefined}
                      aria-current={isCurrent ? "page" : undefined}
                      disabled={!live}
                      onClick={() => onPick?.(p.id)}
                    >
                      {isCurrent && (
                        <motion.span
                          layoutId="md-marker"
                          className="md-marker"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <span className="relative">{p.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="md-live">
          <i aria-hidden /> live
        </div>
      </nav>

      <div className="md-top">
        {onPick ? (
          <label className="md-select">
            <span className="sr-only">Page</span>
            <select value={page} onChange={(e) => onPick(e.target.value as PageId)}>
              {PAGES.filter((p) => available?.has(p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </label>
        ) : (
          <span className="md-select">
            {current.label}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>

      <div className="md-screen">
        <h4 className="md-title">
          <span className="slashes">{"//"}</span>
          {current.label}
        </h4>
        {children}
      </div>
    </div>
  );
}
