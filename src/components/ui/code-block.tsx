"use client";

import { Copy } from "lucide-react";
import { copyText } from "@/lib/copy";
import { Button } from "./button";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="label">{label}</span>
        <Button
          kind="copy"
          size="sm"
          icon={Copy}
          label="Copy"
          doneLabel="Copied"
          run={async (source) => {
            if (source === "user") await copyText(code);
          }}
        />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
