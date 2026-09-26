"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Whether the visitor prefers reduced motion, read straight from the
 * media query via `useSyncExternalStore`.
 *
 * framer-motion's own `useReducedMotion` reads the preference
 * synchronously on the client (a lazy `useState` initialiser), but the
 * server always renders as if there is no preference. Any component
 * that branches its output on that value then produces a server/client
 * mismatch when the visitor actually prefers reduced motion, and React
 * throws away and regenerates the tree on hydration.
 *
 * `useSyncExternalStore`'s `getServerSnapshot` is exactly for this: it
 * keeps the client's first render identical to the server's ("no
 * preference") and switches to the real value in a normal render right
 * after hydration finishes, not during it.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
