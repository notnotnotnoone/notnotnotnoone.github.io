import { cn } from "@/lib/utils";

export function Logo({ size = "md", animate = false }: { size?: "sm" | "md"; animate?: boolean }) {
  const [w, h] = size === "sm" ? [34, 21] : [46, 28];
  return (
    <span className={cn("logo", size === "sm" && "logo-sm")} data-draw={animate || undefined}>
      <svg className="logo-mark" viewBox="0 0 46 28" width={w} height={h} aria-hidden>
        <defs>
          <radialGradient id="fr-mark-glow">
            <stop offset="0" stopColor="#34d399" stopOpacity=".45" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g fill="none" strokeWidth="1.2">
          <path className="lane" pathLength={1} d="M10 4C22 4 24 14 37 14" stroke="#7dd3fc" />
          <path className="lane" pathLength={1} d="M10 14H37" stroke="#a78bfa" />
          <path className="lane" pathLength={1} d="M10 24C22 24 24 14 37 14" stroke="#34d399" />
        </g>
        <rect x="1" y="2.25" width="10" height="3.5" rx="1.75" fill="#7dd3fc" />
        <rect x="1" y="12.25" width="10" height="3.5" rx="1.75" fill="#a78bfa" />
        <rect x="1" y="22.25" width="10" height="3.5" rx="1.75" fill="#34d399" />
        <circle className="node-glow" cx="38" cy="14" r="8" fill="url(#fr-mark-glow)" />
        <circle className="node" cx="38" cy="14" r="3.4" fill="#6ee7b7" />
      </svg>
      <span className="wordmark">flexrouter</span>
    </span>
  );
}
