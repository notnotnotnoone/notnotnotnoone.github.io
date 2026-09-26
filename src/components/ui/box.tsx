import * as React from "react";
import { cn } from "@/lib/utils";

type BoxProps = Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  as?: "div" | "section" | "article";
  title?: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  lift?: boolean;
};

export function Box({ as: Tag = "div", title, sub, action, flush, lift, className, children, ...rest }: BoxProps) {
  return (
    <Tag className={cn("box", lift && "lift", className)} {...rest}>
      {title && (
        <div className="box-head">
          <h3>{title}</h3>
          {sub && <span className="box-sub">{sub}</span>}
          {action && <div className="box-action">{action}</div>}
        </div>
      )}
      {flush ? children : <div className="box-body">{children}</div>}
    </Tag>
  );
}
