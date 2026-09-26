"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = React.useCallback((t: ToastInput) => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((xs) => [...xs, { ...t, id }].slice(-3));
    return id;
  }, []);
  const api = React.useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" data-count={items.length}>
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <Toast key={t.id} item={t} onDone={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [held, setHeld] = React.useState(false);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (held) return;
    const id = setTimeout(onDone, item.ms ?? 4200);
    return () => clearTimeout(id);
  }, [held, item.ms, onDone]);

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
            onDone();
          }}
        >
          {item.action.label}
        </button>
      )}
    </motion.div>
  );
}
