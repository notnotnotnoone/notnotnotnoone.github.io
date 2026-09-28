"use client";

import { useMedia } from "./use-media";

const QUERY = "(prefers-reduced-motion: reduce)";

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
  return useMedia(QUERY);
}
