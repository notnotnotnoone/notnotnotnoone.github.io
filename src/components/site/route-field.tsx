"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";

const NODE = { x: 760, y: 260 };
const LANES = [
  { y: 60, color: "#7dd3fc" },
  { y: 160, color: "#a78bfa" },
  { y: 260, color: "#34d399" },
  { y: 360, color: "#7dd3fc" },
  { y: 460, color: "#a78bfa" },
];
const lanePath = (y: number) => `M-20 ${y} C 380 ${y}, 480 ${NODE.y}, ${NODE.x} ${NODE.y}`;
const OUT = `M${NODE.x} ${NODE.y} H1240`;

/** Behind the hero: five providers' lanes merging into one address, with requests travelling along them. */
export function RouteField() {
  const reduce = useReducedMotion();
  return (
    <svg className="route-field" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="rf-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".25" stopColor="#fff" stopOpacity="1" />
          <stop offset=".85" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="rf-mask">
          <rect width="1200" height="520" fill="url(#rf-fade)" />
        </mask>
        <radialGradient id="rf-node">
          <stop offset="0" stopColor="#34d399" stopOpacity=".5" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask="url(#rf-mask)">
        {LANES.map((l) => (
          <path key={l.y} d={lanePath(l.y)} stroke={l.color} strokeOpacity=".28" fill="none" strokeWidth="1" />
        ))}
        <path d={OUT} stroke="#34d399" strokeOpacity=".45" fill="none" strokeWidth="1.5" />
        {!reduce &&
          LANES.flatMap((l, i) =>
            [0, 1].map((k) => (
              <rect key={`${i}-${k}`} x="-3" y="-3" width="6" height="6" fill={l.color}>
                <animateMotion
                  dur={`${3.4 + i * 0.35}s`}
                  begin={`${-(k * 1.7 + i * 0.45)}s`}
                  repeatCount="indefinite"
                  path={lanePath(l.y)}
                />
              </rect>
            )),
          )}
        {!reduce &&
          [0, 1, 2].map((k) => (
            <rect key={`out-${k}`} x="-3" y="-3" width="6" height="6" fill="#34d399">
              <animateMotion dur="2.2s" begin={`${-k * 0.73}s`} repeatCount="indefinite" path={OUT} />
            </rect>
          ))}
        <circle className="rf-node-glow" cx={NODE.x} cy={NODE.y} r="46" fill="url(#rf-node)" />
        <circle cx={NODE.x} cy={NODE.y} r="5" fill="#6ee7b7" />
      </g>
    </svg>
  );
}
