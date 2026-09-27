"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type ToastInput = {
  text: React.ReactNode;
  tone?: "ok" | "bad";
  action?: { label: string; onAction: () => void };
  ms?: number;
};
type ToastItem = ToastInput & { id: number };
type ToastApi = { push: (t: ToastInput) => number; dismiss: (id: number) => void };

const NOOP: ToastApi = { push: () => 0, dismiss: () => {} };
const Ctx = React.createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  return React.useContext(Ctx) ?? NOOP;
}

export function ToastProvider({
  children,
  resetKey,
}: {
  children: React.ReactNode;
  /** Change this (e.g. to the current story step) to clear every toast; a
   * toast from the step just left means nothing on the step just entered. */
  resetKey?: unknown;
}) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);
  const lastResetKey = React.useRef(resetKey);

  const dismiss = React.useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = React.useCallback((t: ToastInput) => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((xs) => [...xs, { ...t, id }].slice(-3));
    return id;
  }, []);
  const api = React.useMemo(() => ({ push, dismiss }), [push, dismiss]);

  React.useEffect(() => {
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    setItems([]);
  }, [resetKey]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" data-count={items.length}>
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <Toast key={t.id} item={t} id={t.id} dismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function Toast({ item, id, dismiss }: { item: ToastItem; id: number; dismiss: (id: number) => void }) {
  const [held, setHeld] = React.useState(false);
  const reduce = useReducedMotion();

  // `dismiss` is stable (useCallback with no deps) and `id` never changes for
  // a mounted toast, so this effect only reruns when the toast is held/
  // released or its own `ms` changes, not on every provider re-render (see
  // final-findings.md item 4).
  React.useEffect(() => {
    if (held) return;
    const timer = setTimeout(() => dismiss(id), item.ms ?? 4200);
    return () => clearTimeout(timer);
  }, [held, item.ms, id, dismiss]);

  return (
    <motion.div
      layout={!reduce}
      className="toast"
      data-tone={item.tone}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 28 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
    >
      <span>{item.text}</span>
      {item.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            item.action!.onAction();
            dismiss(id);
          }}
        >
          {item.action.label}
        </button>
      )}
    </motion.div>
  );
}
