"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, LoaderCircle, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PressSource, PressState } from "@/lib/press";
import { usePress } from "./use-press";

export const buttonVariants = cva("btn", {
  variants: {
    kind: {
      primary: "btn-primary",
      fix: "btn-fix",
      test: "btn-test",
      copy: "btn-copy",
      danger: "btn-danger",
      ghost: "btn-ghost",
    },
    size: { sm: "btn-sm", md: "", lg: "btn-lg" },
  },
  defaultVariants: { kind: "ghost", size: "md" },
});

export type ButtonKind = NonNullable<VariantProps<typeof buttonVariants>["kind"]>;

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  VariantProps<typeof buttonVariants> & {
    label: React.ReactNode;
    icon?: LucideIcon;
    /** The action. When set, the button shows working / done / failed. */
    run?: (source: PressSource) => Promise<unknown>;
    workingLabel?: string;
    doneLabel?: string;
    /** Change this to a new number above 0 to press the button from outside (the scroll story). */
    trigger?: number;
    /** Show one state without running anything (display only). */
    state?: PressState;
  };

export function Button({
  kind,
  size,
  label,
  icon: Icon,
  run,
  workingLabel,
  doneLabel,
  trigger,
  state: frozen,
  className,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const { state: live, reason, run: press } = usePress();
  const state = frozen ?? live;
  const lastTrigger = React.useRef(0);

  React.useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (run) void press(() => run("trigger"));
  }, [trigger, run, press]);

  const Glyph = state === "working" ? LoaderCircle : state === "done" ? Check : state === "failed" ? X : Icon;
  const text = state === "working" ? (workingLabel ?? label) : state === "done" ? (doneLabel ?? label) : label;

  return (
    <span className="btn-wrap">
      <button
        type={type}
        className={cn(buttonVariants({ kind, size }), className)}
        data-state={state === "idle" ? undefined : state}
        aria-busy={state === "working" || undefined}
        onClick={(e) => {
          onClick?.(e);
          if (run && !e.defaultPrevented && state !== "working") void press(() => run("user"));
        }}
        {...rest}
      >
        {Glyph && <Glyph className="btn-glyph" aria-hidden />}
        <span>{text}</span>
      </button>
      {state === "failed" && reason && (
        <span className="btn-note" role="status">
          {reason}
        </span>
      )}
    </span>
  );
}

export type ButtonLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> &
  VariantProps<typeof buttonVariants> & {
    href: string;
    label: React.ReactNode;
    icon?: LucideIcon;
    external?: boolean;
  };

export function ButtonLink({ kind, size, label, icon: Icon, href, external, className, ...rest }: ButtonLinkProps) {
  const cls = cn(buttonVariants({ kind, size }), className);
  const inner = (
    <>
      {Icon && <Icon className="btn-glyph" aria-hidden />}
      <span>{label}</span>
    </>
  );
  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer" {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <Link className={cls} href={href} {...rest}>
      {inner}
    </Link>
  );
}
