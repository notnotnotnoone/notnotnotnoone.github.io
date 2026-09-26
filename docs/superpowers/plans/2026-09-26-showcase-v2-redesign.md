# Showcase V2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild notnotnotnoone.github.io as a dark, V2-dashboard-styled flexrouter site with a plain-words intro, an Apple-style scroll story that plays every dashboard button and widget, a screenshot tour, a "How it works" section and a dashboard-first quickstart, and make it as flashy as the V2 system allows.

**Architecture:** Next.js 16 static export (unchanged deploy). Tailwind v4 is switched on with the V2 tokens in `@theme`; component-level CSS lives in small files under `src/styles/`. UI primitives are React components in `src/components/ui/` (shadcn layout, set up by hand). The story is a tall section whose sticky child is a restyled container-scroll card holding a mini dashboard; scroll position maps to a step index by a pure function, and each step's screen is a pure function of that index plus a timed choreography that "presses" its buttons.

**Tech Stack:** Next.js 16.2 (App Router, `output: "export"`), React 19.2, TypeScript 5, Tailwind CSS 4, framer-motion 12, lucide-react, class-variance-authority, clsx, tailwind-merge, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-26-showcase-v2-redesign-design.md`

## Global Constraints

- Work on branch `v2-redesign`. Never merge to or push `master` (it auto-deploys). Commit after every task.
- No em dash (U+2014) and no en dash (U+2013) anywhere under `src/`. `npm run check:dashes` enforces it and runs before every build.
- Copy is plain and specific: no hype words, no jokes, no "not X, it's Y", no rhetorical-question headings. Approved copy (hero, "What is flexrouter?", story narration) is used verbatim.
- Dark only. No light theme, no theme toggle, no motion toggle.
- Square corners everywhere; buttons have `border-radius: 2px` at most.
- Status is always glyph plus word: `● Ready`, `◐ Busy`, `◆ Struggling`, `▲ Needs you`, `○ Off`.
- No emojis. Icons come from `lucide-react` only.
- Every animation respects `prefers-reduced-motion`: CSS through the media block in `src/styles/base.css`, JS through framer-motion's `useReducedMotion()`. Reduced means no travel, shake or pop; colours and words still change; spinners pulse slowly.
- Phones: correct at 375px wide, 16px side gutters, no horizontal page scroll.
- The story makes no network requests. The only side effect allowed is writing to the clipboard, and only when the user clicked (source `"user"`).
- `npm run build`, `npm run lint` and `npm test` pass at the end of every task.
- Deviation from spec §3, decided while planning: `@radix-ui/react-slot` is not installed. Links that look like buttons use `ButtonLink` instead of `asChild`.
- "As flashy as possible" means: motion on every section entrance, a live routing field behind the hero, a cursor spotlight on the dot grid, a sliding nav marker in the mini dashboard, layout animations when lists reorder, count-ups on figures, and the gallery's four good-news moments. All of it stays inside the V2 palette and is disabled by reduced motion.

## File Map

```
components.json                         shadcn config (by hand)
vitest.config.mts, vitest.setup.ts      test runner
scripts/check-dashes.mjs (+ .test.mjs)  the no-dash rule
src/app/layout.tsx                      fonts, metadata
src/app/globals.css                     Tailwind import, @theme tokens, imports src/styles/*
src/app/page.tsx                        home page: composes sections
src/app/quickstart/page.tsx             dashboard-first quickstart
src/lib/utils.ts                        cn()
src/lib/press.ts                        button state machine (pure)
src/lib/sim.ts                          fake async work for the story
src/lib/copy.ts                         clipboard helper
src/lib/use-media.ts                    useMedia(query)
src/styles/base.css                     base layer, .box, .label, reduced motion
src/styles/buttons.css                  .btn kinds and states
src/styles/primitives.css               tag, pill, meter, stacked bar, toggle, fold, toast, sheet, field
src/styles/site.css                     nav, logo, spotlight, footer, sections, hero, route field
src/styles/story.css                    container card, mini dashboard, screens
src/components/ui/                      button, use-press, box, tag, pill, countdown, meter,
                                        stacked-bar, count-up, toggle, fold, toast, sheet,
                                        animated-hero, container-scroll-animation, code-block
src/components/site/                    logo, nav, footer, spotlight, reveal, type-heading,
                                        route-field, plain-words, dashboard-tour, how-it-works,
                                        get-started, built-with
src/components/story/                   pages, progress, use-choreo, mini-dash, steps, Story,
                                        drag, screens/*.tsx
public/tour/                            dashboard screenshots (added after 2.3 ships)
```

Removed: `src/app/Demo.tsx`, `src/app/Motion.tsx`, `src/app/Nav.tsx`, packages `gsap` and `lenis`.

---

### Task 1: Test runner and the no-dash check

**Files:**
- Create: `vitest.config.mts`, `vitest.setup.ts`, `scripts/check-dashes.mjs`, `scripts/check-dashes.test.mjs`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Produces: `npm test` (Vitest, jsdom, `@` alias to `src/`), `npm run check:dashes`, `findDashes(text): {line:number; col:number}[]`, `scan(dir): {file:string; line:number; col:number}[]`.

- [ ] **Step 1: Install the test tooling**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Add the Vitest config**

`vitest.config.mts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom has neither of these; framer-motion and the story need them.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
class NoopObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;
```

- [ ] **Step 3: Write the failing test for the dash check**

`scripts/check-dashes.test.mjs`:
```js
import { describe, expect, it } from "vitest";
import { findDashes } from "./check-dashes.mjs";

describe("findDashes", () => {
  it("reports em and en dashes with line and column", () => {
    const EM = String.fromCharCode(0x2014);
    const EN = String.fromCharCode(0x2013);
    const text = `a ${EM} b\nplain line\nx ${EN} y`;
    expect(findDashes(text)).toEqual([
      { line: 1, col: 3 },
      { line: 3, col: 3 },
    ]);
  });

  it("ignores hyphens and minus signs", () => {
    expect(findDashes("a - b, 3-4, -1")).toEqual([]);
  });
});
```

- [ ] **Step 4: Add the scripts to `package.json` and run the test to see it fail**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"check:dashes": "node scripts/check-dashes.mjs src"
```

Run: `npm test`
Expected: FAIL, `Failed to load url ./check-dashes.mjs` (the file does not exist yet).

- [ ] **Step 5: Write the check**

`scripts/check-dashes.mjs`:
```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

// en dash (U+2013) and em dash (U+2014), built from char codes so this file passes its own check
const DASH = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const EXTS = new Set([".ts", ".tsx", ".css", ".md", ".mdx", ".json"]);

export function findDashes(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const col = line.search(DASH);
    if (col !== -1) hits.push({ line: i + 1, col: col + 1 });
  });
  return hits;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTS.has(extname(path))) yield path;
  }
}

export function scan(dir) {
  const out = [];
  for (const file of walk(dir)) {
    for (const hit of findDashes(readFileSync(file, "utf8"))) out.push({ file, ...hit });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = scan(process.argv[2] ?? "src");
  for (const h of hits) {
    console.error(`${h.file}:${h.line}:${h.col} dash character. Use a comma, colon, period or parentheses.`);
  }
  if (hits.length) {
    console.error(`\n${hits.length} dash(es) found.`);
    process.exit(1);
  }
  console.log("No em or en dashes in src/.");
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npm test`
Expected: PASS, 2 tests.

Run: `npm run check:dashes`
Expected: FAIL, listing the old copy in `src/app/page.tsx` and `src/app/quickstart/page.tsx`. That is correct for now; Task 2 replaces those files and wires the check into the build.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.mts vitest.setup.ts scripts/
git commit -m "chore: add vitest and the no-dash copy check"
```

---

### Task 2: Switch the stack to Tailwind v4 + V2 tokens, clear out the old site

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/lib/utils.test.ts`, `src/styles/base.css`
- Replace: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/quickstart/page.tsx`
- Delete: `src/app/Demo.tsx`, `src/app/Motion.tsx`, `src/app/Nav.tsx`
- Modify: `package.json` (dependencies, `prebuild`)

**Interfaces:**
- Produces: `cn(...classes: ClassValue[]): string`; Tailwind colour utilities `ground panel raise rule rule-2 cell-off dot ink ink-2 ink-3 ink-4 green blue violet warn hot bad` (e.g. `text-ink-2`, `bg-panel`, `border-rule`) and `*-wash` variants; `font-sans` = Geist, `font-mono` = Geist Mono; CSS classes `.wrap`, `.label`, `.mono`, `.box` (+ `.lift`, `.box-head`, `.box-sub`, `.box-body`, `.box-action`), `.section-title`, `.slashes`.

- [ ] **Step 1: Swap packages**

```bash
npm uninstall gsap lenis
npm i framer-motion lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: Write the failing test for `cn`**

`src/lib/utils.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy classes and lets later Tailwind classes win", () => {
    expect(cn("px-2", false, "text-ink", "px-4")).toBe("text-ink px-4");
  });
});
```

Run: `npm test -- src/lib/utils.test.ts`
Expected: FAIL, cannot resolve `./utils`.

- [ ] **Step 3: Add `cn` and the shadcn config**

`src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`components.json` (set up by hand because `npx shadcn init` would overwrite `globals.css` with light/dark tokens and rounded defaults; `src/components/ui/` is where shadcn-style components and their `@/components/ui/...` imports expect to live):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Run: `npm test -- src/lib/utils.test.ts`
Expected: PASS.

- [ ] **Step 4: Replace `src/app/globals.css`**

```css
@import "tailwindcss";
@import "../styles/base.css";

@theme {
  --color-ground: #000000;
  --color-panel: #070707;
  --color-raise: #0e0e0e;
  --color-rule: #1f1f1f;
  --color-rule-2: #2e2e2e;
  --color-cell-off: #141414;
  --color-dot: #1c1c1c;
  --color-ink: #f5f5f5;
  --color-ink-2: #a3a3a3;
  --color-ink-3: #6b7280;
  --color-ink-4: #525252;
  --color-green: #34d399;
  --color-green-2: #6ee7b7;
  --color-blue: #7dd3fc;
  --color-violet: #a78bfa;
  --color-warn: #fbbf24;
  --color-hot: #fb923c;
  --color-bad: #f87171;
  --color-green-wash: rgba(52, 211, 153, 0.09);
  --color-blue-wash: rgba(125, 211, 252, 0.08);
  --color-violet-wash: rgba(167, 139, 250, 0.08);
  --color-warn-wash: rgba(251, 191, 36, 0.09);
  --color-hot-wash: rgba(251, 146, 60, 0.09);
  --color-bad-wash: rgba(248, 113, 113, 0.09);

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, "Cascadia Code", monospace;

  --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-move: cubic-bezier(0.25, 1, 0.5, 1);
}
```

Later tasks add one `@import "../styles/<name>.css";` line each, directly under the `base.css` import (CSS `@import` must stay above `@theme`).

- [ ] **Step 5: Write `src/styles/base.css`**

```css
@layer base {
  html {
    color-scheme: dark;
    background: var(--color-ground);
  }
  body {
    margin: 0;
    min-height: 100vh;
    background-color: var(--color-ground);
    background-image: radial-gradient(var(--color-dot) 1px, transparent 1px);
    background-size: 24px 24px;
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    /* clip, not hidden: hidden would make body a scroll container and break position: sticky */
    overflow-x: clip;
  }
  ::selection {
    background: rgba(52, 211, 153, 0.3);
  }
  :focus-visible {
    outline: 1px solid var(--color-green);
    outline-offset: 2px;
  }
  code,
  kbd,
  pre {
    font-family: var(--font-mono);
  }
}

@layer components {
  .wrap {
    max-width: 1120px;
    margin-inline: auto;
    padding-inline: 16px;
  }
  @media (min-width: 768px) {
    .wrap {
      padding-inline: 32px;
    }
  }
  .mono {
    font-family: var(--font-mono);
  }
  .label {
    font: 500 11px/1.3 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink-3);
  }
  .section-title {
    font: 600 clamp(24px, 4vw, 34px) / 1.15 var(--font-mono);
    letter-spacing: -0.01em;
    margin: 0;
  }
  .slashes {
    color: var(--color-ink-4);
    margin-right: 0.4em;
  }

  /* A box: 1px rule, green corner ticks. .lift adds the hover. */
  .box {
    position: relative;
    background: var(--color-panel);
    border: 1px solid var(--color-rule);
    transition:
      border-color 160ms var(--ease-soft),
      transform 220ms var(--ease-soft);
  }
  .box::before,
  .box::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 6px;
    pointer-events: none;
    opacity: 0.75;
    transition:
      width 220ms var(--ease-soft),
      height 220ms var(--ease-soft),
      opacity 160ms var(--ease-soft);
  }
  .box::before {
    top: -1px;
    left: -1px;
    border-top: 1px solid var(--color-green);
    border-left: 1px solid var(--color-green);
  }
  .box::after {
    bottom: -1px;
    right: -1px;
    border-bottom: 1px solid var(--color-green);
    border-right: 1px solid var(--color-green);
  }
  @media (hover: hover) and (pointer: fine) {
    .box.lift:hover {
      transform: translateY(-2px);
      border-color: var(--color-rule-2);
    }
    .box.lift:hover::before,
    .box.lift:hover::after {
      width: 14px;
      height: 14px;
      opacity: 1;
    }
  }
  .box-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-rule);
  }
  .box-head h3 {
    margin: 0;
    font: 600 11px/1.3 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .box-sub {
    font-size: 12px;
    color: var(--color-ink-4);
  }
  .box-action {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .box-body {
    padding: 14px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
@keyframes shake {
  0%,
  100% {
    transform: none;
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Reduced motion: no travel, shake or pop. Rules that must keep a slow
   pulse (spinners) override this with a more specific !important. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: Replace the layout, both pages, and delete the old components**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "flexrouter: run your AI apps on free tiers",
  description:
    "flexrouter pools the free tiers of several AI providers behind one local address. When one model hits its limit, the next best one answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx` (temporary shell, replaced section by section):
```tsx
export default function Home() {
  return (
    <main className="wrap py-24">
      <h1 className="section-title">
        <span className="slashes">//</span>flexrouter
      </h1>
      <div className="box lift mt-8 max-w-md">
        <div className="box-head">
          <h3>Status</h3>
          <span className="box-sub">redesign in progress</span>
        </div>
        <div className="box-body text-ink-2">The new site is being built on this branch.</div>
      </div>
    </main>
  );
}
```

`src/app/quickstart/page.tsx` (temporary shell, replaced in Task 16):
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "flexrouter quickstart" };

export default function Quickstart() {
  return (
    <main className="wrap py-24">
      <h1 className="section-title">
        <span className="slashes">//</span>quickstart
      </h1>
    </main>
  );
}
```

```bash
git rm src/app/Demo.tsx src/app/Motion.tsx src/app/Nav.tsx
```

- [ ] **Step 7: Run the dash check before every build**

In `package.json` `"scripts"`, add:
```json
"prebuild": "npm run check:dashes"
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: tests pass; lint clean; `No em or en dashes in src/.`; build succeeds and writes `out/index.html` and `out/quickstart.html` (or `out/quickstart/index.html`).

Start the `showcase` preview (`.claude/launch.json`, port 3000) and check: black page, 24px dot grid, "// flexrouter" in Geist Mono, a box with green corner ticks that lifts and grows its ticks on hover.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: switch to Tailwind v4 with the V2 tokens, clear out the old site"
```

---

### Task 3: Button (every kind and state)

**Files:**
- Create: `src/lib/press.ts`, `src/lib/press.test.ts`, `src/lib/sim.ts`, `src/lib/copy.ts`, `src/components/ui/use-press.ts`, `src/components/ui/button.tsx`, `src/components/ui/button.test.tsx`, `src/styles/buttons.css`
- Modify: `src/app/globals.css` (import `buttons.css`)

**Interfaces:**
- Produces:
  - `type PressState = "idle" | "working" | "done" | "failed"`, `type PressEvent = "start" | "ok" | "fail" | "reset"`, `nextPress(state, event): PressState`
  - `type PressSource = "user" | "trigger"`
  - `simulate(opts?: { ms?: number; fail?: boolean; reason?: string }): Promise<void>`
  - `copyText(text: string): Promise<void>` (rejects with `Error("Couldn't copy")`)
  - `usePress(settleMs = 1800): { state: PressState; reason: string; run(task: () => Promise<unknown>): Promise<void> }`
  - `type ButtonKind = "primary" | "fix" | "test" | "copy" | "danger" | "ghost"`
  - `<Button kind? size?("sm"|"md"|"lg") label icon? run?(source: PressSource) workingLabel? doneLabel? trigger?(number) state?(PressState) ...buttonAttrs />`. A bump of `trigger` (any change to a value above 0) runs `run("trigger")`; a click runs `run("user")`.
  - `<ButtonLink kind? size? label icon? href external? />`
  - `buttonVariants` (cva)

- [ ] **Step 1: Write the failing state-machine test**

`src/lib/press.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { nextPress } from "./press";

describe("nextPress", () => {
  it("goes idle -> working -> done -> idle", () => {
    expect(nextPress("idle", "start")).toBe("working");
    expect(nextPress("working", "ok")).toBe("done");
    expect(nextPress("done", "reset")).toBe("idle");
  });
  it("goes working -> failed", () => {
    expect(nextPress("working", "fail")).toBe("failed");
  });
  it("ignores ok and fail unless working", () => {
    expect(nextPress("idle", "ok")).toBe("idle");
    expect(nextPress("done", "fail")).toBe("done");
  });
  it("can start again from failed", () => {
    expect(nextPress("failed", "start")).toBe("working");
  });
});
```

Run: `npm test -- src/lib/press.test.ts`
Expected: FAIL, cannot resolve `./press`.

- [ ] **Step 2: Write `press.ts`, `sim.ts`, `copy.ts`**

`src/lib/press.ts`:
```ts
export type PressState = "idle" | "working" | "done" | "failed";
export type PressEvent = "start" | "ok" | "fail" | "reset";
export type PressSource = "user" | "trigger";

export function nextPress(state: PressState, event: PressEvent): PressState {
  if (event === "reset") return "idle";
  if (event === "start") return "working";
  if (state !== "working") return state;
  return event === "ok" ? "done" : "failed";
}
```

`src/lib/sim.ts`:
```ts
/** Fake async work for the story. Never touches the network. */
export function simulate({
  ms = 700,
  fail = false,
  reason = "That didn't work",
}: { ms?: number; fail?: boolean; reason?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error(reason)) : resolve()), ms);
  });
}
```

`src/lib/copy.ts`:
```ts
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    throw new Error("Couldn't copy");
  }
}
```

Run: `npm test -- src/lib/press.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 3: Write the failing Button tests**

`src/components/ui/button.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulate } from "@/lib/sim";
import { Button } from "./button";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Button", () => {
  it("shows working, then done, then settles back to idle", async () => {
    render(
      <Button kind="primary" label="Save" workingLabel="Saving" doneLabel="Saved" run={() => simulate({ ms: 500 })} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "working");
    expect(screen.getByText("Saving")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "done");
    expect(screen.getByText("Saved")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1800);
    });
    expect(screen.getByRole("button")).not.toHaveAttribute("data-state");
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("shows the reason beside the button when the run fails", async () => {
    render(
      <Button
        kind="primary"
        label="Save"
        run={() => simulate({ ms: 300, fail: true, reason: "config.yaml is read-only right now" })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "failed");
    expect(screen.getByRole("status")).toHaveTextContent("config.yaml is read-only right now");
  });

  it("runs with source 'trigger' when trigger is bumped, and 'user' on click", async () => {
    const run = vi.fn(() => simulate({ ms: 100 }));
    const { rerender } = render(<Button label="Test all" run={run} trigger={0} />);
    expect(run).not.toHaveBeenCalled();

    rerender(<Button label="Test all" run={run} trigger={1} />);
    expect(run).toHaveBeenLastCalledWith("trigger");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    fireEvent.click(screen.getByRole("button"));
    expect(run).toHaveBeenLastCalledWith("user");
  });

  it("ignores clicks while working", () => {
    const run = vi.fn(() => simulate({ ms: 500 }));
    render(<Button label="Retry" run={run} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("can show a frozen state", () => {
    render(<Button label="Save" doneLabel="Saved" state="done" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-state", "done");
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/ui/button.test.tsx`
Expected: FAIL, cannot resolve `./button`.

- [ ] **Step 4: Write `use-press.ts`**

`src/components/ui/use-press.ts`:
```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextPress, type PressState } from "@/lib/press";

/** Runs one async task at a time and reports idle / working / done / failed. */
export function usePress(settleMs = 1800) {
  const [state, setState] = useState<PressState>("idle");
  const [reason, setReason] = useState("");
  const busy = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(settle.current), []);

  const run = useCallback(
    async (task: () => Promise<unknown>) => {
      if (busy.current) return;
      busy.current = true;
      clearTimeout(settle.current);
      setReason("");
      setState((s) => nextPress(s, "start"));
      try {
        await task();
        setState((s) => nextPress(s, "ok"));
      } catch (err) {
        setReason(err instanceof Error ? err.message : String(err));
        setState((s) => nextPress(s, "fail"));
      } finally {
        busy.current = false;
        settle.current = setTimeout(() => setState((s) => nextPress(s, "reset")), settleMs);
      }
    },
    [settleMs],
  );

  return { state, reason, run };
}
```

- [ ] **Step 5: Write `button.tsx`**

`src/components/ui/button.tsx`:
```tsx
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
```

- [ ] **Step 6: Write `src/styles/buttons.css` and import it**

Add `@import "../styles/buttons.css";` under the `base.css` import in `globals.css`.

```css
@layer components {
  .btn-wrap {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 10px;
    max-width: 100%;
  }
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font: 500 11px/1 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink);
    background: var(--color-raise);
    border: 1px solid var(--color-rule-2);
    border-radius: 2px;
    padding: 8px 12px;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 160ms var(--ease-soft),
      background-color 160ms var(--ease-soft),
      box-shadow 220ms var(--ease-soft),
      color 160ms var(--ease-soft),
      transform 120ms var(--ease-soft);
  }
  .btn-glyph {
    width: 14px;
    height: 14px;
    flex: none;
  }
  .btn-sm {
    padding: 6px 9px;
    font-size: 10px;
  }
  .btn-lg {
    padding: 13px 20px;
    font-size: 12px;
    gap: 10px;
  }
  .btn-lg .btn-glyph {
    width: 16px;
    height: 16px;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn:not(:disabled):active {
    transform: scale(0.97);
  }
  @media (hover: hover) and (pointer: fine) {
    .btn:not(:disabled):hover {
      border-color: var(--color-ink-3);
    }
  }

  /* kinds */
  .btn-primary {
    color: var(--color-green);
    border-color: rgba(52, 211, 153, 0.45);
    background: var(--color-green-wash);
  }
  .btn-fix {
    color: var(--color-blue);
    border-color: rgba(125, 211, 252, 0.4);
    background: var(--color-blue-wash);
    text-transform: none;
    letter-spacing: 0;
    font-size: 12px;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: left;
  }
  .btn-test {
    color: var(--color-violet);
    border-color: rgba(167, 139, 250, 0.4);
    background: transparent;
  }
  .btn-copy {
    color: var(--color-ink-2);
    background: transparent;
    padding: 6px 9px;
  }
  .btn-danger {
    color: var(--color-bad);
    border-color: rgba(248, 113, 113, 0.4);
    background: transparent;
  }
  .btn-ghost {
    color: var(--color-ink-2);
    background: transparent;
    border-color: transparent;
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-primary:not(:disabled):hover {
      border-color: var(--color-green);
      box-shadow:
        0 0 0 1px rgba(52, 211, 153, 0.25),
        0 0 28px -6px rgba(52, 211, 153, 0.55);
    }
    .btn-fix:not(:disabled):hover {
      border-color: var(--color-blue);
    }
    .btn-test:not(:disabled):hover {
      border-color: var(--color-violet);
      background: var(--color-violet-wash);
    }
    .btn-copy:not(:disabled):hover,
    .btn-ghost:not(:disabled):hover {
      color: var(--color-ink);
    }
    .btn-ghost:not(:disabled):hover {
      border-color: var(--color-rule-2);
    }
    .btn-danger:not(:disabled):hover {
      border-color: var(--color-bad);
      background: var(--color-bad-wash);
    }
  }

  /* states */
  .btn[data-state="working"] {
    cursor: progress;
  }
  .btn[data-state="working"] .btn-glyph {
    animation: spin 700ms linear infinite;
  }
  .btn[data-state="done"] {
    color: var(--color-green);
    border-color: var(--color-green);
    background: var(--color-green-wash);
  }
  .btn[data-state="done"] .btn-glyph,
  .btn[data-state="failed"] .btn-glyph {
    stroke-dasharray: 24;
    animation: draw 260ms var(--ease-soft) both;
  }
  .btn[data-state="failed"] {
    color: var(--color-bad);
    border-color: var(--color-bad);
    background: var(--color-bad-wash);
    animation: shake 320ms var(--ease-soft);
  }
  .btn-note {
    font: 400 12px/1.4 var(--font-mono);
    color: var(--color-bad);
    animation: note-in 200ms var(--ease-soft);
  }
}

@keyframes draw {
  from {
    stroke-dashoffset: 24;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes note-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn[data-state="working"] .btn-glyph {
    animation: pulse 1.4s ease-in-out infinite !important;
  }
}
```

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: PASS (all tests so far).

- [ ] **Step 8: Put every kind on the shell page and look at it**

Temporarily add to `src/app/page.tsx`, inside `<main>` under the box (this block is deleted in Task 7):
```tsx
<div className="mt-8 flex flex-wrap gap-3">
  <Button kind="primary" icon={Save} label="Save" state="idle" />
  <Button kind="primary" label="Save" workingLabel="Saving" state="working" />
  <Button kind="primary" label="Save" doneLabel="Saved" state="done" />
  <Button kind="primary" label="Save" state="failed" />
  <Button kind="fix" icon={Wrench} label="Use gemini-3-flash-preview" />
  <Button kind="test" icon={Zap} label="Test all" />
  <Button kind="copy" icon={Copy} label="Copy curl" />
  <Button kind="danger" icon={Trash2} label="Remove" />
  <Button kind="ghost" label="Replay story" />
  <Button kind="primary" label="Disabled" disabled />
</div>
```
with imports `import { Button } from "@/components/ui/button";` and `import { Copy, Save, Trash2, Wrench, Zap } from "lucide-react";`. `page.tsx` stays a server component; `Button` is a client component and that is fine.

In the preview, compare against the widget gallery (`widget-gallery` launch config, `http://localhost:4899/.scratch/polish/showcase/`): colours, borders, the spinner, the tick drawing in, the failed shake. Emulate reduced motion (`resize_window` has no motion option; use DevTools rendering emulation, or trust the CSS media block and check it in Task 17).

- [ ] **Step 9: Lint, build, commit**

Run: `npm run lint && npm run build`
Expected: both succeed.

```bash
git add -A
git commit -m "feat: Button with every dashboard kind and state"
```

---

### Task 4: Display primitives (box, tag, pill, countdown, meter, stacked bar, count-up)

**Files:**
- Create: `src/components/ui/box.tsx`, `tag.tsx`, `pill.tsx`, `countdown.tsx`, `meter.tsx`, `stacked-bar.tsx`, `count-up.tsx`, `src/components/ui/primitives.test.tsx`, `src/styles/primitives.css`
- Modify: `src/app/globals.css` (import `primitives.css`)

**Interfaces:**
- Produces:
  - `<Box as?("div"|"section"|"article") title? sub? action? flush? lift? className? ...htmlAttrs>` (renders `.box`, optional `.box-head`, body in `.box-body` unless `flush`)
  - `type TagTone = "free" | "paid" | "limit" | "provider" | "muted"`; `<Tag tone?>`
  - `type Status = "ready" | "busy" | "struggling" | "needs" | "off"`; `STATUS: Record<Status, { glyph: string; word: string }>`; `<Pill status countdown?(seconds) />`
  - `formatCountdown(seconds: number, prefix = "back in"): string`; `<Countdown seconds prefix? />`
  - `filledCells(value, max, cells = 20): number`; `meterTone(value, max): "ok" | "warn" | "bad"`; `<Meter value max cells? share? wave? label? />`
  - `segmentWidths(values: number[]): number[]` (percentages); `<StackedBar segments={{ label; value; color }[]} />`
  - `<CountUp to play className? />`

- [ ] **Step 1: Write the failing tests**

`src/components/ui/primitives.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountUp } from "./count-up";
import { formatCountdown } from "./countdown";
import { filledCells, Meter, meterTone } from "./meter";
import { Pill, STATUS, type Status } from "./pill";
import { segmentWidths } from "./stacked-bar";

describe("meter maths", () => {
  it("fills cells in proportion and clamps", () => {
    expect(filledCells(0, 30)).toBe(0);
    expect(filledCells(15, 30)).toBe(10);
    expect(filledCells(45, 30)).toBe(20);
    expect(filledCells(3, 0)).toBe(0);
    expect(filledCells(1, 2, 10)).toBe(5);
  });
  it("turns warn at 80% and bad at 100%", () => {
    expect(meterTone(79, 100)).toBe("ok");
    expect(meterTone(80, 100)).toBe("warn");
    expect(meterTone(100, 100)).toBe("bad");
  });
  it("renders one cell per slot with the filled ones marked", () => {
    const { container } = render(<Meter value={5} max={10} cells={10} label="usage" />);
    expect(container.querySelectorAll(".meter-cell")).toHaveLength(10);
    expect(container.querySelectorAll(".meter-cell[data-on]")).toHaveLength(5);
    expect(screen.getByRole("meter", { name: "usage" })).toHaveAttribute("aria-valuenow", "5");
  });
});

describe("Pill", () => {
  it("always shows a glyph and a word", () => {
    const all: Status[] = ["ready", "busy", "struggling", "needs", "off"];
    for (const s of all) {
      const { unmount } = render(<Pill status={s} />);
      expect(screen.getByText(STATUS[s].glyph)).toBeInTheDocument();
      expect(screen.getByText(STATUS[s].word)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("formatCountdown", () => {
  it("formats seconds and minutes", () => {
    expect(formatCountdown(42)).toBe("back in 42s");
    expect(formatCountdown(125, "resets in")).toBe("resets in 2m 5s");
    expect(formatCountdown(0)).toBe("back now");
  });
});

describe("segmentWidths", () => {
  it("returns percentages that sum to 100", () => {
    expect(segmentWidths([1, 1, 2])).toEqual([25, 25, 50]);
    expect(segmentWidths([0, 0])).toEqual([0, 0]);
  });
});

describe("CountUp", () => {
  it("shows the final figure when not playing", () => {
    render(<CountUp to={32866} play={false} />);
    expect(screen.getByText("32,866")).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/ui/primitives.test.tsx`
Expected: FAIL, cannot resolve `./count-up`.

- [ ] **Step 2: Write the components**

`src/components/ui/box.tsx`:
```tsx
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
```

`src/components/ui/tag.tsx`:
```tsx
import * as React from "react";

export type TagTone = "free" | "paid" | "limit" | "provider" | "muted";

export function Tag({ tone = "muted", children }: { tone?: TagTone; children: React.ReactNode }) {
  return (
    <span className="tag" data-tone={tone}>
      {children}
    </span>
  );
}
```

`src/components/ui/countdown.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

export function formatCountdown(seconds: number, prefix = "back in"): string {
  if (seconds <= 0) return prefix === "back in" ? "back now" : `${prefix} 0s`;
  if (seconds < 60) return `${prefix} ${seconds}s`;
  return `${prefix} ${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function Countdown({ seconds, prefix = "back in" }: { seconds: number; prefix?: string }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="countdown">{formatCountdown(left, prefix)}</span>;
}
```

`src/components/ui/pill.tsx`:
```tsx
import { Countdown } from "./countdown";

export type Status = "ready" | "busy" | "struggling" | "needs" | "off";

export const STATUS: Record<Status, { glyph: string; word: string }> = {
  ready: { glyph: "●", word: "Ready" },
  busy: { glyph: "◐", word: "Busy" },
  struggling: { glyph: "◆", word: "Struggling" },
  needs: { glyph: "▲", word: "Needs you" },
  off: { glyph: "○", word: "Off" },
};

export function Pill({ status, countdown }: { status: Status; countdown?: number }) {
  return (
    <span className="pill" data-status={status}>
      <span className="pill-dot" aria-hidden>
        {STATUS[status].glyph}
      </span>
      <span className="pill-word">{STATUS[status].word}</span>
      {countdown !== undefined && <Countdown seconds={countdown} />}
    </span>
  );
}
```

`src/components/ui/meter.tsx`:
```tsx
import * as React from "react";

export function filledCells(value: number, max: number, cells = 20): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(cells, Math.round((value / max) * cells)));
}

export function meterTone(value: number, max: number): "ok" | "warn" | "bad" {
  const ratio = max <= 0 ? 0 : value / max;
  if (ratio >= 1) return "bad";
  if (ratio >= 0.8) return "warn";
  return "ok";
}

/** The dashboard's block meter. `share` means "compared with the busiest", so it never turns red. `wave` replays the good-news wave when it changes. */
export function Meter({
  value,
  max,
  cells = 20,
  share = false,
  wave = 0,
  label,
}: {
  value: number;
  max: number;
  cells?: number;
  share?: boolean;
  wave?: number;
  label?: string;
}) {
  const on = filledCells(value, max, cells);
  const tone = share ? "ok" : meterTone(value, max);
  return (
    <span
      key={wave}
      className="meter"
      data-tone={tone}
      data-wave={wave > 0 || undefined}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {Array.from({ length: cells }, (_, i) => (
        <i key={i} className="meter-cell" data-on={i < on || undefined} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </span>
  );
}
```

`src/components/ui/stacked-bar.tsx`:
```tsx
import * as React from "react";

export function segmentWidths(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  return values.map((v) => (v / total) * 100);
}

export type Segment = { label: string; value: number; color: string };

export function StackedBar({ segments }: { segments: Segment[] }) {
  const widths = segmentWidths(segments.map((s) => s.value));
  return (
    <div>
      <div className="stack" role="img" aria-label={segments.map((s) => `${s.label} ${s.value.toLocaleString("en-US")}`).join(", ")}>
        {segments.map((s, i) => (
          <i
            key={s.label}
            className="stack-seg"
            style={{ width: `${widths[i]}%`, background: s.color, "--i": i } as React.CSSProperties}
          />
        ))}
      </div>
      <ul className="stack-key">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} aria-hidden />
            {s.label} <span className="text-ink-3">{s.value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/components/ui/count-up.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function CountUp({ to, play, className }: { to: number; play: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(play && !reduce ? 0 : to);

  useEffect(() => {
    if (!play || reduce) return;
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [play, reduce, to]);

  return <span className={className}>{fmt(play && !reduce ? shown : to)}</span>;
}
```

- [ ] **Step 3: Write `src/styles/primitives.css` (display part) and import it**

Add `@import "../styles/primitives.css";` under the `buttons.css` import.

```css
@layer components {
  .tag {
    display: inline-flex;
    align-items: center;
    font: 500 10px/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 6px;
    border: 1px solid var(--color-rule-2);
    color: var(--color-ink-3);
    white-space: nowrap;
  }
  .tag[data-tone="free"] {
    color: var(--color-green);
    border-color: rgba(52, 211, 153, 0.4);
  }
  .tag[data-tone="paid"] {
    color: var(--color-ink-3);
  }
  .tag[data-tone="limit"] {
    color: var(--color-ink-2);
  }
  .tag[data-tone="provider"] {
    color: var(--color-blue);
    border-color: rgba(125, 211, 252, 0.35);
  }

  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font: 500 11px/1.2 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .pill-dot {
    display: inline-block;
    transition: transform 300ms var(--ease-soft);
  }
  .pill[data-status="ready"] {
    color: var(--color-green);
  }
  .pill[data-status="busy"] {
    color: var(--color-blue);
  }
  .pill[data-status="struggling"] {
    color: var(--color-hot);
  }
  .pill[data-status="needs"] {
    color: var(--color-bad);
  }
  .pill[data-status="off"] {
    color: var(--color-ink-4);
  }
  .pill[data-status="busy"] .pill-dot {
    animation: pulse 1.6s ease-in-out infinite;
  }
  .countdown {
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-ink-3);
    font-variant-numeric: tabular-nums;
  }

  .meter {
    display: inline-flex;
    gap: 2px;
    vertical-align: middle;
  }
  .meter-cell {
    width: 7px;
    height: 11px;
    background: var(--color-cell-off);
    transition: background-color 240ms var(--ease-soft);
    transition-delay: calc(var(--i) * 18ms);
  }
  .meter[data-tone="ok"] .meter-cell[data-on] {
    background: var(--color-green);
  }
  .meter[data-tone="warn"] .meter-cell[data-on] {
    background: var(--color-warn);
  }
  .meter[data-tone="bad"] .meter-cell[data-on] {
    background: var(--color-bad);
  }
  .meter[data-wave] .meter-cell {
    animation: cell-wave 520ms var(--ease-soft) both;
    animation-delay: calc(var(--i) * 28ms);
  }

  .stack {
    display: flex;
    height: 22px;
    gap: 2px;
    background: var(--color-cell-off);
  }
  .stack-seg {
    display: block;
    height: 100%;
    transform-origin: left;
    animation: grow-x 900ms var(--ease-soft) both;
    animation-delay: calc(var(--i) * 120ms);
  }
  .stack-key {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    list-style: none;
    padding: 0;
    margin: 10px 0 0;
    font: 500 12px var(--font-mono);
  }
  .stack-key i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
  }
}

@keyframes cell-wave {
  40% {
    transform: translateY(-4px) scaleY(1.35);
    background: var(--color-green-2);
  }
}
@keyframes grow-x {
  from {
    transform: scaleX(0);
  }
}
```

- [ ] **Step 4: Run tests, lint, build**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: display primitives (box, tag, pill, countdown, meter, stacked bar, count-up)"
```

---

### Task 5: Interactive primitives (toggle, fold, toast, sheet)

**Files:**
- Create: `src/components/ui/toast.tsx`, `toggle.tsx`, `fold.tsx`, `sheet.tsx`, `src/components/ui/interactive.test.tsx`
- Modify: `src/styles/primitives.css` (append)

**Interfaces:**
- Consumes: `simulate` (Task 3).
- Produces:
  - `type ToastInput = { text: React.ReactNode; tone?: "ok" | "bad"; action?: { label: string; onAction: () => void }; ms?: number }`
  - `<ToastProvider>`; `useToast(): { push(t: ToastInput): number; dismiss(id: number): void }` (no-op outside a provider); at most three toasts; hovering one holds it; default 4200 ms.
  - `<Toggle label defaultOn? save?(next: boolean) => Promise<unknown> trigger? onChange?(on: boolean) />`. Flips at once; shows working only if the save takes over 150 ms; on failure snaps back, shakes, and pushes a `bad` toast with the error message.
  - `<Fold summary note? defaultOpen? trigger? >children</Fold>`; a bump of `trigger` opens it.
  - `<Sheet open onClose title>children</Sheet>` (slides in from the right, inside the nearest positioned parent).

- [ ] **Step 1: Write the failing tests**

`src/components/ui/interactive.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulate } from "@/lib/sim";
import { Fold } from "./fold";
import { ToastProvider, useToast, type ToastInput } from "./toast";
import { Toggle } from "./toggle";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function Pusher({ input }: { input: ToastInput }) {
  const { push } = useToast();
  return <button onClick={() => push(input)}>push</button>;
}

describe("toasts", () => {
  // Exiting toasts stay in the DOM until framer-motion finishes their exit
  // animation, so these tests read the provider's own count instead.
  it("keeps at most three", () => {
    const { container } = render(
      <ToastProvider>
        <Pusher input={{ text: "Saved" }} />
      </ToastProvider>,
    );
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByText("push"));
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "3");
  });

  it("runs the action and closes", () => {
    const undo = vi.fn();
    render(
      <ToastProvider>
        <Pusher input={{ text: "Removed ministral-3b", action: { label: "Undo", onAction: undo } }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("push"));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
  });

  it("goes away by itself", async () => {
    const { container } = render(
      <ToastProvider>
        <Pusher input={{ text: "Saved", ms: 1000 }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("push"));
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "1");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(container.querySelector(".toasts")).toHaveAttribute("data-count", "0");
  });
});

describe("Toggle", () => {
  it("flips at once", () => {
    render(<Toggle label="nvidia" defaultOn={false} />);
    const sw = screen.getByRole("switch", { name: "nvidia" });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("snaps back when the save fails", async () => {
    render(
      <ToastProvider>
        <Toggle label="nvidia" defaultOn={false} save={() => simulate({ ms: 300, fail: true, reason: "Couldn't save" })} />
      </ToastProvider>,
    );
    const sw = screen.getByRole("switch", { name: "nvidia" });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
  });
});

describe("Fold", () => {
  it("opens when triggered", () => {
    const { rerender } = render(
      <Fold summary="Tried first" trigger={0}>
        groq 429
      </Fold>,
    );
    const details = screen.getByText("Tried first").closest("details")!;
    expect(details.open).toBe(false);
    rerender(
      <Fold summary="Tried first" trigger={1}>
        groq 429
      </Fold>,
    );
    expect(details.open).toBe(true);
  });
});
```

Run: `npm test -- src/components/ui/interactive.test.tsx`
Expected: FAIL, cannot resolve `./fold`.

- [ ] **Step 2: Write the components**

`src/components/ui/toast.tsx`:
```tsx
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
```

`src/components/ui/toggle.tsx`:
```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "./toast";

export function Toggle({
  label,
  defaultOn = false,
  save,
  trigger,
  onChange,
}: {
  label: string;
  defaultOn?: boolean;
  save?: (next: boolean) => Promise<unknown>;
  trigger?: number;
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = React.useState(defaultOn);
  const [working, setWorking] = React.useState(false);
  const [fails, setFails] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const busy = React.useRef(false);
  const lastTrigger = React.useRef(0);
  const toast = useToast();

  const flip = React.useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const next = !on;
    setOn(next);
    setFailed(false);
    onChange?.(next);
    const slow = setTimeout(() => setWorking(true), 150);
    try {
      await save?.(next);
    } catch (err) {
      setOn(!next);
      onChange?.(!next);
      setFails((n) => n + 1);
      setFailed(true);
      setTimeout(() => setFailed(false), 1200);
      toast.push({ text: err instanceof Error ? err.message : String(err), tone: "bad" });
    } finally {
      clearTimeout(slow);
      setWorking(false);
      busy.current = false;
    }
  }, [on, save, onChange, toast]);

  React.useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    void flip();
  }, [trigger, flip]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="switch"
      data-state={working ? "working" : failed ? "failed" : undefined}
      onClick={() => void flip()}
    >
      <span key={fails} className={cn("switch-track", fails > 0 && "is-shake")}>
        <i />
      </span>
    </button>
  );
}
```

`src/components/ui/fold.tsx`:
```tsx
"use client";

import * as React from "react";

export function Fold({
  summary,
  note,
  defaultOpen = false,
  trigger,
  children,
}: {
  summary: React.ReactNode;
  note?: React.ReactNode;
  defaultOpen?: boolean;
  trigger?: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const lastTrigger = React.useRef(0);

  React.useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (ref.current) ref.current.open = true;
  }, [trigger]);

  return (
    <details ref={ref} className="fold" open={defaultOpen || undefined}>
      <summary>
        {summary}
        {note && <span className="n">{note}</span>}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
```

`src/components/ui/sheet.tsx`:
```tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="sheet"
          role="dialog"
          aria-label={typeof title === "string" ? title : "Details"}
          initial={reduce ? { opacity: 0 } : { x: "100%" }}
          animate={reduce ? { opacity: 1 } : { x: 0 }}
          exit={reduce ? { opacity: 0 } : { x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          <div className="sheet-head">
            <span className="label">{title}</span>
            <button type="button" className="sheet-close" aria-label="Close" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="sheet-body">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Append the interactive CSS to `src/styles/primitives.css`**

```css
@layer components {
  .switch {
    display: inline-flex;
    align-items: center;
    padding: 4px 0;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .switch-track {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 16px;
    background: var(--color-cell-off);
    border: 1px solid var(--color-rule-2);
    transition:
      background-color 160ms var(--ease-soft),
      border-color 160ms var(--ease-soft);
  }
  .switch-track i {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 10px;
    height: 10px;
    background: var(--color-ink-3);
    transition:
      transform 200ms var(--ease-move),
      background-color 160ms var(--ease-soft);
  }
  .switch[aria-checked="true"] .switch-track {
    background: var(--color-green-wash);
    border-color: var(--color-green);
  }
  .switch[aria-checked="true"] .switch-track i {
    transform: translateX(14px);
    background: var(--color-green);
  }
  .switch[data-state="working"] .switch-track i {
    animation: pulse 700ms ease-in-out infinite;
  }
  .switch[data-state="failed"] .switch-track {
    border-color: var(--color-bad);
  }
  .switch-track.is-shake {
    animation: shake 320ms var(--ease-soft);
  }

  .fold > summary {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 4px 0;
    font: 500 11px var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-ink-3);
    cursor: pointer;
    list-style: none;
    transition: color 160ms var(--ease-soft);
  }
  .fold > summary::-webkit-details-marker {
    display: none;
  }
  .fold > summary::before {
    content: "";
    width: 5px;
    height: 5px;
    border-right: 1px solid currentColor;
    border-bottom: 1px solid currentColor;
    transform: rotate(-45deg);
    transition: transform 200ms var(--ease-soft);
  }
  .fold[open] > summary::before {
    transform: rotate(45deg);
  }
  .fold > summary:hover,
  .fold[open] > summary {
    color: var(--color-ink);
  }
  .fold .n {
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-ink-4);
  }
  .fold-body {
    padding: 6px 0 4px 14px;
    border-left: 1px solid var(--color-rule-2);
    margin: 4px 0 0 3px;
  }
  .fold[open] > .fold-body {
    animation: fold-in 220ms var(--ease-soft);
  }

  .toasts {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: min(360px, calc(100vw - 48px));
    background: var(--color-raise);
    border: 1px solid var(--color-rule-2);
    border-left: 2px solid var(--color-green);
    padding: 10px 12px;
    font: 500 12px/1.4 var(--font-mono);
    box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.8);
  }
  .toast[data-tone="bad"] {
    border-left-color: var(--color-bad);
  }
  .toast-action {
    font: 600 11px var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-green);
    background: none;
    border: 0;
    padding: 2px 4px;
    cursor: pointer;
  }

  .sheet {
    position: absolute;
    inset: 0 0 0 auto;
    z-index: 20;
    width: min(380px, 100%);
    background: var(--color-raise);
    border-left: 1px solid var(--color-rule-2);
    box-shadow: -24px 0 48px -24px rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
  }
  .sheet-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-rule);
  }
  .sheet-close {
    background: none;
    border: 0;
    color: var(--color-ink-3);
    cursor: pointer;
  }
  .sheet-body {
    padding: 14px;
    overflow: auto;
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .field {
    font: 400 13px var(--font-mono);
    color: var(--color-ink);
    background: var(--color-raise);
    border: 1px solid var(--color-rule-2);
    padding: 7px 9px;
    min-width: 0;
  }
  .field:focus {
    border-color: var(--color-green);
    outline: none;
  }
}

@keyframes fold-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
```

- [ ] **Step 4: Run tests, lint, build**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: toggle, fold, toast and sheet primitives"
```

---

### Task 6: Site chrome (logo, nav, footer, spotlight, reveal, section titles)

**Files:**
- Create: `src/lib/links.ts`, `src/lib/use-media.ts`, `src/components/site/logo.tsx`, `nav.tsx`, `footer.tsx`, `spotlight.tsx`, `reveal.tsx`, `section-title.tsx`, `src/components/site/chrome.test.tsx`, `src/styles/site.css`
- Modify: `src/app/globals.css` (import `site.css`), `src/app/layout.tsx` (noscript fallback), `src/app/page.tsx`, `src/styles/base.css` (fixed dot grid)

**Interfaces:**
- Produces:
  - `GITHUB`, `CHANGELOG`, `STASH`, `AGORA` URL constants
  - `useMedia(query: string): boolean` (false on the server); `useIsClient(): boolean`
  - `<Logo size?("sm"|"md") animate? />` (the dashboard mark plus the gradient wordmark)
  - `<Nav />` (sticky, with a green scroll-progress line), `<Footer />`
  - `<Spotlight />` (fixed cursor glow that lights up the dot grid; off on touch and reduced motion)
  - `<Reveal delay? className?>` (fade and rise on first view; class `reveal`)
  - `<SectionTitle id?>{string}</SectionTitle>` (`//` prefix, types itself in once, block caret)

- [ ] **Step 1: Write the failing tests**

`src/components/site/chrome.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./footer";
import { Nav } from "./nav";
import { SectionTitle } from "./section-title";

describe("Nav", () => {
  it("links home, to the quickstart and to GitHub", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "flexrouter home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Quickstart" })).toHaveAttribute("href", "/quickstart");
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/notnotnotnoone/flexrouter",
    );
  });
});

describe("SectionTitle", () => {
  it("keeps the full text in the DOM for search engines and screen readers", () => {
    render(<SectionTitle>How it works</SectionTitle>);
    expect(screen.getByRole("heading", { level: 2, name: "How it works" })).toBeInTheDocument();
  });
});

describe("Footer", () => {
  it("names the licence", () => {
    render(<Footer />);
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/site/chrome.test.tsx`
Expected: FAIL, cannot resolve `./footer`.

- [ ] **Step 2: Write the helpers**

`src/lib/links.ts`:
```ts
export const GITHUB = "https://github.com/notnotnotnoone/flexrouter";
export const CHANGELOG = `${GITHUB}/blob/master/CHANGELOG.md`;
export const STASH = "https://github.com/notnotnotnoone/stash";
export const AGORA = "https://github.com/notnotnotnoone/agora";
```

`src/lib/use-media.ts`:
```ts
"use client";

import { useSyncExternalStore } from "react";

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const noop = () => () => {};

/** True after hydration, false while rendering on the server. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
```

- [ ] **Step 3: Write the components**

`src/components/site/logo.tsx` (same drawing as the dashboard's `render.py` `_brand()`):
```tsx
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
```

`src/components/site/nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { GITHUB } from "@/lib/links";
import { Logo } from "./logo";

export function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 });
  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <Link href="/" aria-label="flexrouter home" className="nav-home">
          <Logo animate />
        </Link>
        <div className="nav-links">
          <Link href="/quickstart">Quickstart</Link>
          <Link href="/#built" className="nav-hide-sm">
            Other projects
          </Link>
          <a href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <motion.div className="nav-progress" style={{ scaleX }} aria-hidden />
    </nav>
  );
}
```

`src/components/site/footer.tsx`:
```tsx
import Link from "next/link";
import { AGORA, GITHUB, STASH } from "@/lib/links";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-in">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-ink-3">Open source, MIT licence. Built by notnotnotnoone.</p>
        </div>
        <ul className="footer-links">
          <li>
            <Link href="/quickstart">Quickstart</Link>
          </li>
          <li>
            <a href={GITHUB}>flexrouter on GitHub</a>
          </li>
          <li>
            <a href={STASH}>stash</a>
          </li>
          <li>
            <a href={AGORA}>agora</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
```

`src/components/site/spotlight.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/** A soft green light that follows the pointer and lights up the dot grid under it. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.dataset.on = "";
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [reduce]);

  return <div ref={ref} className="spotlight" aria-hidden />;
}
```

`src/components/site/reveal.tsx`:
```tsx
"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("reveal", className)}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

`src/components/site/section-title.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useIsClient } from "@/lib/use-media";

/** "// Title" that types itself in once, then leaves a blinking block caret. The real text stays in the DOM. */
export function SectionTitle({ children, id }: { children: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const client = useIsClient();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => {
      setN((v) => {
        if (v >= children.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 32);
    return () => clearInterval(id);
  }, [inView, reduce, children]);

  const typing = client && !reduce;
  return (
    <h2 ref={ref} id={id} className="section-title" data-typing={typing || undefined}>
      <span className="slashes" aria-hidden>
        //
      </span>
      <span className="type-wrap">
        <span className="type-ghost">{children}</span>
        {typing && (
          <span className="type-live" aria-hidden>
            {children.slice(0, n)}
            <span className="caret" />
          </span>
        )}
      </span>
    </h2>
  );
}
```

- [ ] **Step 4: Write `src/styles/site.css` (chrome part) and import it**

Add `@import "../styles/site.css";` under the `primitives.css` import. In `base.css`, add `background-attachment: fixed;` to `body` so the dot grid lines up with the spotlight layer.

```css
@layer components {
  .site-main {
    position: relative;
    z-index: 1;
  }
  .section {
    padding-block: clamp(64px, 10vw, 128px);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .wordmark {
    font: 700 19px/1 var(--font-sans);
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, var(--color-blue), var(--color-violet) 55%, var(--color-green));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .logo-sm .wordmark {
    font-size: 14px;
  }
  .logo .node-glow {
    transform-origin: 38px 14px;
    animation: node-breathe 2.8s ease-in-out infinite;
  }
  .logo[data-draw] .lane {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: lane-draw 900ms var(--ease-soft) forwards;
  }
  .logo[data-draw] .lane:nth-child(2) {
    animation-delay: 120ms;
  }
  .logo[data-draw] .lane:nth-child(3) {
    animation-delay: 240ms;
  }

  .site-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--color-rule);
  }
  .nav-in {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 22px;
    font: 500 13px var(--font-mono);
    color: var(--color-ink-2);
  }
  .nav-links a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    transition: color 160ms var(--ease-soft);
  }
  .nav-links a:hover {
    color: var(--color-ink);
  }
  @media (max-width: 520px) {
    .nav-hide-sm {
      display: none !important;
    }
  }
  .nav-progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: linear-gradient(90deg, var(--color-blue), var(--color-violet), var(--color-green));
    transform-origin: left;
  }

  .spotlight {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 600ms var(--ease-soft);
    background: radial-gradient(640px circle at var(--x) var(--y), rgba(52, 211, 153, 0.06), transparent 60%);
  }
  .spotlight::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(52, 211, 153, 0.6) 1px, transparent 1px);
    background-size: 24px 24px;
    -webkit-mask-image: radial-gradient(200px circle at var(--x) var(--y), #000, transparent 70%);
    mask-image: radial-gradient(200px circle at var(--x) var(--y), #000, transparent 70%);
  }
  .spotlight[data-on] {
    opacity: 1;
  }

  .type-wrap {
    position: relative;
    display: inline-block;
  }
  .section-title[data-typing] .type-ghost {
    visibility: hidden;
  }
  .type-live {
    position: absolute;
    inset: 0;
  }
  .caret {
    display: inline-block;
    width: 0.55em;
    height: 0.9em;
    margin-left: 3px;
    vertical-align: -0.08em;
    background: var(--color-green);
    animation: blink 1s steps(1) infinite;
  }

  .site-footer {
    border-top: 1px solid var(--color-rule);
    padding-block: 40px;
    position: relative;
    z-index: 1;
  }
  .footer-in {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 24px;
  }
  .footer-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    font: 500 13px var(--font-mono);
    color: var(--color-ink-2);
  }
  .footer-links a:hover {
    color: var(--color-ink);
  }
}

@keyframes node-breathe {
  50% {
    transform: scale(1.35);
    opacity: 0.6;
  }
}
@keyframes lane-draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

`.type-live` sits exactly over the hidden ghost text and wraps the same way, so long titles wrap on phones without overflowing.

- [ ] **Step 5: No-JS fallback and the page shell**

In `src/app/layout.tsx`, add inside `<html>` before `<body>`:
```tsx
<head>
  <noscript>
    <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
  </noscript>
</head>
```

Replace `src/app/page.tsx` (drops the Task 3 button row):
```tsx
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { SectionTitle } from "@/components/site/section-title";
import { Spotlight } from "@/components/site/spotlight";

export default function Home() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main">
        <section className="wrap section">
          <Reveal>
            <SectionTitle>Redesign in progress</SectionTitle>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview: the logo's three lanes draw in on load and the node breathes; the green progress line under the nav grows as you scroll (add temporary height if the page is too short to scroll: not needed after Task 7); moving the mouse lights the dots under it; the section title types in with a green block caret.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: site chrome with logo, nav progress, spotlight, reveal and typed titles"
```

---

### Task 7: Hero (animated hero restyled, live routing field)

**Files:**
- Create: `src/components/ui/use-rotating-index.ts`, `src/components/ui/use-rotating-index.test.ts`, `src/components/ui/animated-hero.tsx`, `src/components/site/route-field.tsx`
- Modify: `src/styles/site.css` (append hero styles), `src/app/page.tsx`

**Interfaces:**
- Consumes: `ButtonLink` (Task 3), `Button` (Task 3), `copyText` (Task 3), `GITHUB`, `CHANGELOG` (Task 6).
- Produces: `useRotatingIndex(length: number, ms = 2000): number`, `<Hero />`, `<RouteField />`, `HERO_WORDS`.

- [ ] **Step 1: Write the failing test**

`src/components/ui/use-rotating-index.test.ts`:
```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRotatingIndex } from "./use-rotating-index";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useRotatingIndex", () => {
  it("steps every interval and wraps", () => {
    const { result } = renderHook(() => useRotatingIndex(3, 1000));
    expect(result.current).toBe(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
  });
});
```

Run: `npm test -- src/components/ui/use-rotating-index.test.ts`
Expected: FAIL, cannot resolve `./use-rotating-index`.

- [ ] **Step 2: Write the hook**

`src/components/ui/use-rotating-index.ts`:
```ts
"use client";

import { useEffect, useState } from "react";

export function useRotatingIndex(length: number, ms = 2000): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((v) => (v + 1) % length), ms);
    return () => clearTimeout(id);
  }, [i, length, ms]);
  return i;
}
```

Run: `npm test -- src/components/ui/use-rotating-index.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the routing field**

`src/components/site/route-field.tsx`:
```tsx
"use client";

import { useReducedMotion } from "framer-motion";

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
```

- [ ] **Step 4: Write the hero (the pasted `animated-hero.tsx`, restyled to V2)**

`src/components/ui/animated-hero.tsx`:
```tsx
"use client";

import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import { ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { RouteField } from "@/components/site/route-field";
import { copyText } from "@/lib/copy";
import { CHANGELOG, GITHUB } from "@/lib/links";
import { Button, ButtonLink } from "./button";
import { useRotatingIndex } from "./use-rotating-index";

export const HERO_WORDS = ["groq", "google", "mistral", "cerebras", "openrouter"];
const INSTALL = "pip install git+https://github.com/notnotnotnoone/flexrouter";
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const i = useRotatingIndex(HERO_WORDS.length, 2000);
  const reduce = useReducedMotion();

  const enter = (n: number): MotionProps =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18, filter: "blur(6px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { delay: 0.15 + n * 0.12, duration: 0.8, ease: EASE },
        };

  return (
    <header className="hero">
      <RouteField />
      <div className="wrap hero-in">
        <motion.div {...enter(0)}>
          <ButtonLink kind="ghost" size="sm" href={CHANGELOG} external icon={ArrowUpRight} label="flexrouter 2.3 · see what changed" className="hero-badge" />
        </motion.div>

        <motion.h1 className="hero-title" {...enter(1)}>
          <span className="sr-only">Your app keeps answering when one provider runs out.</span>
          <span aria-hidden>
            Your app keeps answering when{" "}
            <span className="hero-word">
              <span className="hero-word-size">openrouter</span>
              {HERO_WORDS.map((w, k) => (
                <motion.span
                  key={w}
                  className="hero-word-item"
                  initial={{ opacity: 0, y: reduce ? 0 : "-100%" }}
                  transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 50 }}
                  animate={i === k ? { y: 0, opacity: 1 } : { y: reduce ? 0 : i > k ? "-150%" : "150%", opacity: 0 }}
                >
                  {w}
                </motion.span>
              ))}
            </span>{" "}
            runs out.
          </span>
        </motion.h1>

        <motion.p className="hero-sub" {...enter(2)}>
          flexrouter pools the free tiers of several AI providers behind one local address. When one model hits its
          limit, the next best one answers. You pay nothing unless you allow it.
        </motion.p>

        <motion.div className="hero-cta" {...enter(3)}>
          <ButtonLink kind="primary" size="lg" href="/quickstart" icon={ArrowRight} label="Quickstart" />
          <ButtonLink kind="ghost" size="lg" href={GITHUB} external icon={ArrowUpRight} label="View on GitHub" />
        </motion.div>

        <motion.div className="hero-cmd" {...enter(4)}>
          <code>
            <span className="text-ink-4">$</span> {INSTALL}
          </code>
          <Button
            kind="copy"
            size="sm"
            icon={Copy}
            label="Copy"
            doneLabel="Copied"
            run={async (source) => {
              if (source === "user") await copyText(INSTALL);
            }}
          />
        </motion.div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Append the hero styles to `src/styles/site.css`**

```css
@layer components {
  .hero {
    position: relative;
    overflow: hidden;
    padding-block: clamp(72px, 12vw, 150px) clamp(56px, 8vw, 110px);
    border-bottom: 1px solid var(--color-rule);
  }
  .route-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.55;
    pointer-events: none;
  }
  .rf-node-glow {
    transform-box: fill-box;
    transform-origin: center;
    animation: node-breathe 3.2s ease-in-out infinite;
  }
  .hero-in {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 26px;
  }
  .hero-badge {
    border-color: var(--color-rule-2);
    background: rgba(0, 0, 0, 0.6);
  }
  .hero-title {
    margin: 0;
    max-width: 18ch;
    font: 600 clamp(34px, 7vw, 76px) / 1.04 var(--font-mono);
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .hero-word {
    position: relative;
    display: inline-block;
    vertical-align: bottom;
    overflow: hidden;
    padding-bottom: 0.08em;
  }
  .hero-word-size {
    visibility: hidden;
  }
  .hero-word-item {
    position: absolute;
    inset: 0 0 auto 0;
    text-align: center;
    color: var(--color-green);
    text-shadow: 0 0 32px rgba(52, 211, 153, 0.35);
  }
  .hero-sub {
    margin: 0;
    max-width: 58ch;
    font-size: clamp(15px, 1.8vw, 18px);
    color: var(--color-ink-2);
  }
  .hero-cta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }
  .hero-cmd {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    padding: 6px 6px 6px 12px;
    border: 1px solid var(--color-rule);
    background: rgba(7, 7, 7, 0.8);
    font-size: 12px;
  }
  .hero-cmd code {
    overflow-x: auto;
    white-space: nowrap;
    color: var(--color-ink-2);
  }
}
```

- [ ] **Step 6: Put the hero on the page**

In `src/app/page.tsx`, import `Hero` from `@/components/ui/animated-hero` and render `<Hero />` as the first child of `<main className="site-main">`, above the placeholder section.

- [ ] **Step 7: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview at 1280px and 375px: the badge, title, text, buttons and command chip rise in one after another; the green word springs through groq, google, mistral, cerebras, openrouter without the line jumping; small squares travel along the lanes into the node and out along the green line; nothing overflows sideways at 375px (the command chip scrolls inside itself).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: hero with the rotating provider word and a live routing field"
```

---

### Task 8: "What is flexrouter?" (plain words)

**Files:**
- Create: `src/components/site/plain-words.tsx`, `src/components/site/plain-words.test.tsx`
- Modify: `src/styles/site.css` (append), `src/app/page.tsx`

**Interfaces:**
- Consumes: `Box` (Task 4), `Reveal`, `SectionTitle` (Task 6).
- Produces: `<PlainWords />` with `id="what"`.

- [ ] **Step 1: Write the failing test (it pins the approved copy)**

`src/components/site/plain-words.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlainWords } from "./plain-words";

describe("PlainWords", () => {
  it("has the approved heading, short answer and date note", () => {
    render(<PlainWords />);
    expect(screen.getByRole("heading", { name: "What is flexrouter?" })).toBeInTheDocument();
    expect(
      screen.getByText("a tool that lets apps run on free AI without hitting the limits.", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Limits as of September 2026.")).toBeInTheDocument();
    expect(screen.getByText(/can fire off a dozen requests for a single thing you ask it/)).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/site/plain-words.test.tsx`
Expected: FAIL, cannot resolve `./plain-words`.

- [ ] **Step 2: Write the section (copy is verbatim from spec §5.3)**

`src/components/site/plain-words.tsx`:
```tsx
import { Box } from "@/components/ui/box";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

export function PlainWords() {
  return (
    <section className="wrap section" id="what">
      <Reveal>
        <Box lift className="plain">
          <SectionTitle>What is flexrouter?</SectionTitle>
          <p className="plain-short">
            <strong>Short answer:</strong> a tool that lets apps run on free AI without hitting the limits.
          </p>
          <p>
            Google, Groq, Mistral and a few other AI companies give developers free access to their models, but the
            limits are tight. Some of Google&apos;s newest models allow 20 requests a day. Groq&apos;s free tier stops at
            around 30 a minute. That sounds like plenty until you realise a modern AI app, like a coding assistant or
            anything that uses tools, can fire off a dozen requests for a single thing you ask it. On one free account,
            it stalls within minutes.
          </p>
          <p>
            flexrouter pools them. It runs in the background on your computer, and every app sends its AI requests to
            it instead of to one company. It tracks how much free usage is left everywhere and sends each request to
            the best model that still has room. When one hits its limit, the next one takes over, so the app keeps
            working and the bill stays at zero.
          </p>
          <p>A dashboard shows where every request went, what&apos;s left for the day, and what broke and why.</p>
          <p className="plain-asof">Limits as of September 2026.</p>
        </Box>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 3: Append the styles to `src/styles/site.css`**

```css
@layer components {
  .plain {
    max-width: 760px;
    margin-inline: auto;
  }
  .plain .box-body {
    padding: clamp(22px, 4vw, 40px);
    display: grid;
    gap: 16px;
  }
  .plain p {
    margin: 0;
    color: var(--color-ink-2);
    font-size: 16px;
    line-height: 1.7;
  }
  .plain .plain-short {
    color: var(--color-ink);
    font-size: clamp(18px, 2.2vw, 21px);
    line-height: 1.5;
  }
  .plain .plain-short strong {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-green);
  }
  .plain .plain-asof {
    font: 500 11px var(--font-mono);
    color: var(--color-ink-4);
  }
}
```

- [ ] **Step 4: Put it on the page**

In `src/app/page.tsx`, replace the placeholder "Redesign in progress" section with `<PlainWords />` (import from `@/components/site/plain-words`), directly after `<Hero />`.

- [ ] **Step 5: Run tests, lint, build, commit**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

```bash
git add -A
git commit -m "feat: plain-words explanation for non-coders"
```

---

### Task 9: The story engine (pin, tilt, steps, mini dashboard)

**Files:**
- Create: `src/components/story/pages.ts`, `progress.ts`, `progress.test.ts`, `use-choreo.ts`, `use-choreo.test.ts`, `mini-dash.tsx`, `steps.tsx`, `steps.test.tsx`, `Story.tsx`, `story.test.tsx`, `src/components/ui/container-scroll-animation.tsx`, `src/styles/story.css`
- Modify: `src/app/globals.css` (import `story.css`), `src/app/page.tsx`

**Interfaces:**
- Consumes: `Button` (Task 3), `ToastProvider` (Task 5), `Logo` (Task 6), `useMedia` (Task 6).
- Produces:
  - `type PageId = "overview" | "providers" | "models" | "buckets" | "requests" | "playground" | "status" | "allowance" | "settings"`; `PAGES: { id: PageId; label: string }[]`
  - `type StoryPos = { step: number; free: boolean }`; `storyPos(top: number, vh: number, count: number): StoryPos`
  - `useChoreo(trigger: number, cues: Array<[ms: number, fn: () => void]>): void` (runs cues once each time `trigger` changes to a value above 0; clears on unmount)
  - `type ScreenProps = { trigger: number }` (0 = free play, no choreography; 1 = the story is playing this step)
  - `type StepDef = { narration: string; page: PageId; Screen: React.ComponentType<ScreenProps> }`; `STEPS: StepDef[]` (9 entries)
  - `<ContainerScroll targetRef titleComponent>children</ContainerScroll>`
  - `<MiniDash page available? onPick?>children</MiniDash>`
  - `<Story />` (section `id="story"`)

- [ ] **Step 1: Write the failing tests**

`src/components/story/progress.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { storyPos } from "./progress";

describe("storyPos", () => {
  const vh = 800;
  it("is step 0 before the section reaches the top", () => {
    expect(storyPos(400, vh, 9)).toEqual({ step: 0, free: false });
  });
  it("moves one step per viewport scrolled", () => {
    expect(storyPos(-1, vh, 9)).toEqual({ step: 0, free: false });
    expect(storyPos(-800, vh, 9)).toEqual({ step: 1, free: false });
    expect(storyPos(-800 * 4.5, vh, 9)).toEqual({ step: 4, free: false });
  });
  it("stays on the last step, then switches to free play half a viewport before the end", () => {
    expect(storyPos(-800 * 8.2, vh, 9)).toEqual({ step: 8, free: false });
    expect(storyPos(-800 * 8.6, vh, 9)).toEqual({ step: 8, free: true });
    expect(storyPos(-800 * 20, vh, 9)).toEqual({ step: 8, free: true });
  });
  it("survives a zero-height viewport", () => {
    expect(storyPos(-100, 0, 9)).toEqual({ step: 0, free: false });
  });
});
```

`src/components/story/use-choreo.test.ts`:
```ts
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChoreo } from "./use-choreo";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useChoreo", () => {
  it("does nothing at trigger 0, runs every cue in time at trigger 1", () => {
    const a = vi.fn();
    const b = vi.fn();
    const { rerender } = renderHook(({ t }) => useChoreo(t, [[100, a], [300, b]]), { initialProps: { t: 0 } });
    vi.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();

    rerender({ t: 1 });
    vi.advanceTimersByTime(100);
    expect(a).toHaveBeenCalledOnce();
    expect(b).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(b).toHaveBeenCalledOnce();
  });

  it("cancels pending cues on unmount", () => {
    const a = vi.fn();
    const { unmount } = renderHook(() => useChoreo(1, [[500, a]]));
    unmount();
    vi.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();
  });
});
```

`src/components/story/steps.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import { PAGES } from "./pages";
import { STEPS } from "./steps";

describe("STEPS", () => {
  it("has the nine approved narration lines in order", () => {
    expect(STEPS.map((s) => s.narration)).toEqual([
      "flexrouter, open for the first time.",
      "Pick a free provider and paste a key.",
      "Let AI find the models and rank them.",
      "Check that every model answers.",
      "Send traffic. When a model runs out, the next one answers.",
      "Every request shows its whole journey.",
      "When something breaks, it says why and offers the fix.",
      "Change anything by hand.",
      "See how much free usage is left today.",
    ]);
  });
  it("only uses pages that exist in the menu", () => {
    const ids = new Set(PAGES.map((p) => p.id));
    for (const s of STEPS) expect(ids.has(s.page)).toBe(true);
  });
});
```

`src/components/story/story.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Story } from "./Story";

describe("Story", () => {
  it("starts on the first step", () => {
    render(<Story />);
    expect(screen.getByText("flexrouter, open for the first time.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Dashboard pages" })).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/story`
Expected: FAIL, cannot resolve `./progress` (and the others).

- [ ] **Step 2: Write `pages.ts`, `progress.ts`, `use-choreo.ts`**

`src/components/story/pages.ts`:
```ts
export type PageId =
  | "overview"
  | "providers"
  | "models"
  | "buckets"
  | "requests"
  | "playground"
  | "status"
  | "allowance"
  | "settings";

/** The 2.3 dashboard menu (Status replaces What's broken and Error brain). */
export const PAGES: { id: PageId; label: string; group: "The router" | "Traffic" | "System" }[] = [
  { id: "overview", label: "Overview", group: "The router" },
  { id: "providers", label: "Providers & keys", group: "The router" },
  { id: "models", label: "Models", group: "The router" },
  { id: "buckets", label: "Buckets", group: "The router" },
  { id: "requests", label: "Requests", group: "Traffic" },
  { id: "playground", label: "Playground", group: "Traffic" },
  { id: "status", label: "Status", group: "Traffic" },
  { id: "allowance", label: "Allowance", group: "Traffic" },
  { id: "settings", label: "Settings", group: "System" },
];
```

`src/components/story/progress.ts`:
```ts
export type StoryPos = { step: number; free: boolean };

/**
 * Where the reader is in the story. `top` is the story section's
 * getBoundingClientRect().top; each step takes one viewport of scroll.
 * The section is (count + 1) viewports tall, so free play starts half a
 * viewport before the pin releases.
 */
export function storyPos(top: number, vh: number, count: number): StoryPos {
  if (vh <= 0) return { step: 0, free: false };
  const into = -top / vh;
  const step = Math.max(0, Math.min(count - 1, Math.floor(into)));
  return { step, free: into > count - 0.5 };
}
```

`src/components/story/use-choreo.ts`:
```ts
"use client";

import { useEffect, useRef } from "react";

export type Cue = [ms: number, fn: () => void];

/** Plays timed cues once whenever `trigger` changes to a value above 0. */
export function useChoreo(trigger: number, cues: Cue[]) {
  const latest = useRef(cues);
  useEffect(() => {
    latest.current = cues;
  });
  useEffect(() => {
    if (!trigger) return;
    const ids = latest.current.map(([ms, fn]) => setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, [trigger]);
}
```

- [ ] **Step 3: Write the container scroll (the pasted component, restyled)**

`src/components/ui/container-scroll-animation.tsx`:
```tsx
"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMedia } from "@/lib/use-media";

/**
 * The window tilts back and scales down as its section scrolls in, and is
 * flat by the time the section reaches the top of the viewport (where the
 * story pins it). `targetRef` is the tall story section.
 */
export function ContainerScroll({
  titleComponent,
  children,
  targetRef,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start end", "start start"] });
  const reduce = useReducedMotion();
  const isMobile = useMedia("(max-width: 768px)");

  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : isMobile ? [0.7, 0.92] : [1.05, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, 0]);
  const glow = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  return (
    <div className="scroll-stage">
      <motion.div className="scroll-title" style={{ y: lift }}>
        {titleComponent}
      </motion.div>
      <motion.div className="scroll-card box" style={{ rotateX: rotate, scale }}>
        <motion.span className="scroll-card-glow" style={{ opacity: glow }} aria-hidden />
        {children}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Write the mini dashboard shell**

`src/components/story/mini-dash.tsx`:
```tsx
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
          <span className="slashes">//</span>
          {current.label}
        </h4>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `steps.tsx` with placeholder screens**

Tasks 10 to 13 replace each placeholder with its real screen.

`src/components/story/steps.tsx`:
```tsx
import type { ComponentType } from "react";
import type { PageId } from "./pages";

export type ScreenProps = { trigger: number };
export type StepDef = { narration: string; page: PageId; Screen: ComponentType<ScreenProps> };

function placeholder(name: string): ComponentType<ScreenProps> {
  function Placeholder() {
    return <p className="label">{name}</p>;
  }
  return Placeholder;
}

export const STEPS: StepDef[] = [
  { narration: "flexrouter, open for the first time.", page: "overview", Screen: placeholder("Welcome") },
  { narration: "Pick a free provider and paste a key.", page: "providers", Screen: placeholder("Providers") },
  { narration: "Let AI find the models and rank them.", page: "buckets", Screen: placeholder("Buckets") },
  { narration: "Check that every model answers.", page: "overview", Screen: placeholder("Test all") },
  {
    narration: "Send traffic. When a model runs out, the next one answers.",
    page: "requests",
    Screen: placeholder("Traffic"),
  },
  { narration: "Every request shows its whole journey.", page: "requests", Screen: placeholder("Request") },
  {
    narration: "When something breaks, it says why and offers the fix.",
    page: "status",
    Screen: placeholder("Status"),
  },
  { narration: "Change anything by hand.", page: "settings", Screen: placeholder("Tweak") },
  { narration: "See how much free usage is left today.", page: "allowance", Screen: placeholder("Allowance") },
];
```

- [ ] **Step 6: Write `Story.tsx`**

`src/components/story/Story.tsx`:
```tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { ToastProvider } from "@/components/ui/toast";
import { MiniDash } from "./mini-dash";
import type { PageId } from "./pages";
import { storyPos, type StoryPos } from "./progress";
import { STEPS } from "./steps";

const AVAILABLE: ReadonlySet<PageId> = new Set(STEPS.map((s) => s.page));
const LAST = STEPS.length - 1;

/** The last step that shows a page, so free play can jump to it. */
function stepForPage(page: PageId): number {
  for (let i = LAST; i >= 0; i--) if (STEPS[i].page === page) return i;
  return LAST;
}

export function Story() {
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = React.useState<StoryPos>({ step: 0, free: false });
  const [freeStep, setFreeStep] = React.useState(LAST);

  React.useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const next = storyPos(el.getBoundingClientRect().top, window.innerHeight, STEPS.length);
      setPos((p) => (p.step === next.step && p.free === next.free ? p : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shown = pos.free ? freeStep : pos.step;
  const step = STEPS[shown];
  const Screen = step.Screen;

  const replay = () => {
    setFreeStep(LAST);
    const top = (ref.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  const title = (
    <div className="story-narration" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pos.free ? "free" : pos.step}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="story-line"
        >
          {pos.free ? (
            <>
              <span>Everything here is live. Press anything.</span>
              <Button kind="ghost" size="sm" icon={RotateCcw} label="Replay story" onClick={replay} />
            </>
          ) : (
            <>
              <span className="story-count">
                {pos.step}/{LAST}
              </span>
              <span>{STEPS[pos.step].narration}</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <section
      ref={ref}
      id="story"
      aria-label="flexrouter, step by step"
      className="story"
      style={{ height: `${(STEPS.length + 1) * 100}vh` }}
    >
      <div className="story-pin">
        <ContainerScroll targetRef={ref} titleComponent={title}>
          <ToastProvider>
            <MiniDash page={step.page} available={AVAILABLE} onPick={pos.free ? (p) => setFreeStep(stepForPage(p)) : undefined}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${shown}-${pos.free ? "free" : "story"}`}
                  className="md-screen-inner"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Screen trigger={pos.free ? 0 : 1} />
                </motion.div>
              </AnimatePresence>
            </MiniDash>
          </ToastProvider>
        </ContainerScroll>
        <ol className="story-rail" aria-hidden>
          {STEPS.map((_, k) => (
            <li key={k} data-on={pos.free || k <= pos.step || undefined} data-current={(!pos.free && k === pos.step) || undefined} />
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Write `src/styles/story.css` and import it**

Add `@import "../styles/story.css";` under the `site.css` import.

```css
@layer components {
  .story {
    position: relative;
  }
  .story-pin {
    position: sticky;
    top: 0;
    height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 72px 16px 20px;
    overflow: hidden;
  }
  .scroll-stage {
    width: 100%;
    max-width: 1040px;
    perspective: 1000px;
  }
  .scroll-title {
    text-align: center;
    margin-bottom: 18px;
  }
  .story-narration {
    min-height: 3.2em;
    display: grid;
    place-items: center;
  }
  .story-line {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 6px 12px;
    font: 600 clamp(15px, 2.2vw, 21px) / 1.35 var(--font-mono);
    max-width: 46ch;
  }
  .story-count {
    color: var(--color-green);
    font-variant-numeric: tabular-nums;
  }
  .scroll-card {
    position: relative;
    height: min(580px, calc(100svh - 230px));
    transform-origin: top center;
    background: var(--color-panel);
    box-shadow: 0 50px 120px -50px rgba(52, 211, 153, 0.28);
    overflow: hidden;
  }
  .scroll-card-glow {
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-green), transparent);
    pointer-events: none;
    z-index: 5;
  }
  .story-rail {
    display: flex;
    gap: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .story-rail li {
    width: 22px;
    height: 3px;
    background: var(--color-rule-2);
    transition:
      background-color 300ms var(--ease-soft),
      box-shadow 300ms var(--ease-soft);
  }
  .story-rail li[data-on] {
    background: var(--color-green);
  }
  .story-rail li[data-current] {
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.8);
  }

  .mini-dash {
    display: grid;
    grid-template-columns: 188px 1fr;
    grid-template-rows: 1fr;
    height: 100%;
  }
  .md-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 12px;
    border-right: 1px solid var(--color-rule);
    background: #030303;
    overflow: hidden;
  }
  .md-group ul {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
  }
  .md-item {
    position: relative;
    width: 100%;
    text-align: left;
    padding: 5px 10px;
    background: none;
    border: 0;
    color: var(--color-ink-3);
    font: 400 13px var(--font-sans);
    cursor: pointer;
  }
  .md-item:disabled {
    cursor: default;
  }
  .md-item:not(:disabled):hover {
    color: var(--color-ink);
  }
  .md-item[data-current] {
    color: var(--color-ink);
  }
  .md-marker {
    position: absolute;
    inset: 0;
    background: var(--color-raise);
    border-left: 2px solid var(--color-green);
  }
  .md-live {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    font: 500 10px var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink-4);
  }
  .md-live i {
    width: 6px;
    height: 6px;
    background: var(--color-green);
    animation: pulse 2.4s ease-in-out infinite;
  }
  .md-top {
    display: none;
  }
  .md-screen {
    position: relative;
    overflow: auto;
    padding: 18px 20px;
  }
  .md-title {
    margin: 0 0 14px;
    font: 600 15px var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  .md-screen-inner {
    display: grid;
    gap: 14px;
  }

  @media (max-width: 768px) {
    .mini-dash {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
    .md-side {
      display: none;
    }
    .md-top {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--color-rule);
    }
    .md-select {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font: 600 12px var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .md-select select {
      appearance: none;
      background: none;
      border: 0;
      color: var(--color-ink);
      font: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
    }
    .md-title {
      display: none;
    }
    .md-screen {
      padding: 14px;
    }
    .scroll-card {
      height: calc(100svh - 210px);
    }
  }
}
```

- [ ] **Step 8: Put the story on the page**

In `src/app/page.tsx`, import `Story` from `@/components/story/Story` and render `<Story />` after `<PlainWords />`.

- [ ] **Step 9: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview at 1280×800: as the section scrolls in, the window tilts from 20° to flat and scales from 1.05 to 1, and the green top edge fades in; once flat it pins; each viewport of scroll changes the narration (blur-slide), the counter, the rail and the sidebar marker (it slides between items); near the end the line changes to "Everything here is live. Press anything." with Replay story, and the sidebar becomes clickable for the pages that have screens; Replay scrolls back to step 0. Check at 375×812: no sidebar, a "Page ▾" line instead, window scales 0.7 to 0.92, no sideways scroll.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scroll story engine with the tilting window and pinned mini dashboard"
```

---

### Task 10: Story screens 0 to 2 (Get started, Providers, Buckets)

**Files:**
- Create: `src/components/ui/segmented.tsx`, `src/components/story/screens/get-started-card.tsx`, `screens/providers.tsx`, `screens/buckets-logic.ts`, `screens/buckets.tsx`, `screens/screens-a.test.tsx`
- Modify: `src/components/story/steps.tsx` (steps 0, 1, 2), `src/styles/story.css` (append)

**Interfaces:**
- Consumes: `Box`, `Tag`, `Pill`, `Meter` (Task 4); `Button` (Task 3); `simulate` (Task 3); `useChoreo`, `ScreenProps` (Task 9).
- Produces:
  - `<Segmented value options label onChange />` (radio group with a sliding highlight)
  - `GS_TASKS: string[]`; `<GetStartedCard done celebrate? />`; `WelcomeScreen`
  - `ProvidersScreen`, `BucketsScreen`
  - `type Found = { id: string; score: number; tps: number }`; `type Mode = "smartest" | "fastest"`; `FOUND: Found[]`; `orderModels(models, ranked, mode): Found[]`; `answering(ordered, mode): Set<string>`; `movement(id, ordered): number`

- [ ] **Step 1: Write the failing tests**

`src/components/story/screens/screens-a.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { answering, FOUND, movement, orderModels } from "./buckets-logic";
import { GetStartedCard } from "./get-started-card";
import { ProvidersScreen } from "./providers";

describe("bucket ordering", () => {
  it("leaves the found order alone until ranked", () => {
    expect(orderModels(FOUND, false, "smartest")).toEqual(FOUND);
  });
  it("ranks by score or by speed", () => {
    expect(orderModels(FOUND, true, "smartest")[0].id).toBe("googleai/gemini-3.8-flash");
    expect(orderModels(FOUND, true, "fastest")[0].id).toBe("googleai/gemini-3.5-flash-lite");
  });
  it("marks the models within 20% of the best as able to answer", () => {
    expect(answering(orderModels(FOUND, true, "smartest"), "smartest").size).toBe(5);
    expect(answering(orderModels(FOUND, true, "fastest"), "fastest").size).toBe(2);
  });
  it("reports how far a model moved when ranked", () => {
    const ranked = orderModels(FOUND, true, "smartest");
    expect(movement("googleai/gemini-3.8-flash", ranked)).toBe(1);
    expect(movement("mistral/mistral-medium-latest", ranked)).toBe(-4);
  });
});

describe("GetStartedCard", () => {
  it("counts and ticks finished tasks", () => {
    const { container } = render(<GetStartedCard done={2} />);
    expect(screen.getByText("2 of 5 done")).toBeInTheDocument();
    expect(container.querySelectorAll(".gs-item[data-done]")).toHaveLength(2);
  });
});

describe("ProvidersScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is interactive in free play", () => {
    render(<ProvidersScreen trigger={0} />);
    expect(screen.queryByLabelText("Groq key")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Groq/ }));
    expect(screen.getByLabelText("Groq key")).toBeInTheDocument();
  });

  it("plays: pick Groq, test the key, add a second key", async () => {
    render(<ProvidersScreen trigger={1} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.getByText("2 keys, used in turn. A key that hits its limit is skipped.")).toBeInTheDocument();
    expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(2);
  });
});
```

Run: `npm test -- src/components/story/screens`
Expected: FAIL, cannot resolve `./buckets-logic`.

- [ ] **Step 2: Write `segmented.tsx`**

`src/components/ui/segmented.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";

export function Segmented<T extends string>({
  value,
  options,
  label,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  label: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="seg-btn"
          onClick={() => onChange(o.value)}
        >
          {o.value === value && (
            <motion.span layoutId={`seg-${label}`} className="seg-bg" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write the Get started card**

`src/components/story/screens/get-started-card.tsx`:
```tsx
import * as React from "react";
import { Check } from "lucide-react";
import { Box } from "@/components/ui/box";
import { cn } from "@/lib/utils";

export const GS_TASKS = [
  "Add a provider",
  "Paste its key",
  "Add models with AI",
  "Test all",
  "Point your app at localhost:4891/v1",
];

export function GetStartedCard({ done, celebrate = false }: { done: number; celebrate?: boolean }) {
  return (
    <Box title="Get started" sub={`${done} of 5 done`} className={cn("gs", celebrate && "gs-complete")}>
      <ol className="gs-list">
        {GS_TASKS.map((t, i) => (
          <li key={t} className="gs-item" data-done={i < done || undefined} style={{ "--i": i } as React.CSSProperties}>
            <span className="gs-tick" aria-hidden>
              {i < done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </Box>
  );
}

export function WelcomeScreen() {
  return (
    <>
      <GetStartedCard done={0} />
      <p className="hint">Shown on first start, and again whenever no model works. Each step ticks itself.</p>
    </>
  );
}
```

- [ ] **Step 4: Write the Providers screen**

`src/components/story/screens/providers.tsx`:
```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Zap } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

const PRESETS = [
  { name: "Groq", free: true },
  { name: "Google AI Studio", free: true },
  { name: "Mistral", free: true },
  { name: "Cerebras", free: true },
  { name: "OpenRouter", free: true },
  { name: "DeepSeek", free: false },
];

export function ProvidersScreen({ trigger }: ScreenProps) {
  const [picked, setPicked] = useState(false);
  const [key, setKey] = useState("");
  const [test, setTest] = useState(0);
  const [tested, setTested] = useState(false);
  const [keys, setKeys] = useState(1);

  useChoreo(trigger, [
    [300, () => setPicked(true)],
    [800, () => setKey("gsk_live_8Qx••••••••4f2a")],
    [1200, () => setTest(1)],
    [2800, () => setKeys(2)],
  ]);

  return (
    <>
      <Box title="Add a provider" sub="pick one, paste a key">
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="preset"
              data-picked={(p.name === "Groq" && picked) || undefined}
              onClick={() => p.name === "Groq" && setPicked(true)}
            >
              <span>{p.name}</span>
              <Tag tone={p.free ? "free" : "paid"}>{p.free ? "Free tier" : "Paid"}</Tag>
            </button>
          ))}
        </div>
      </Box>

      <AnimatePresence>
        {picked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Box title="Groq" sub="per account">
              <div className="row">
                <input
                  className="field flex-1"
                  aria-label="Groq key"
                  placeholder="Paste your key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <Button
                  kind="test"
                  icon={Zap}
                  label="Test key"
                  workingLabel="Testing"
                  doneLabel="Works"
                  trigger={test}
                  run={async () => {
                    await simulate({ ms: 800 });
                    setTested(true);
                  }}
                />
              </div>
              <div className="row">
                <span className="mono">key 1 · gsk_••••4f2a</span>
                <Pill status={tested ? "ready" : "off"} />
              </div>
              <AnimatePresence>
                {keys > 1 && (
                  <motion.div className="row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <span className="mono">key 2 · gsk_••••91c0</span>
                    <Pill status="ready" />
                  </motion.div>
                )}
              </AnimatePresence>
              {keys > 1 ? (
                <p className="hint">2 keys, used in turn. A key that hits its limit is skipped.</p>
              ) : (
                <Button kind="ghost" size="sm" icon={KeyRound} label="Add another key" onClick={() => setKeys(2)} />
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 5: Write the bucket logic and screen**

`src/components/story/screens/buckets-logic.ts`:
```ts
export type Found = { id: string; score: number; tps: number };
export type Mode = "smartest" | "fastest";

/** What "Add models with AI" finds, in the order it finds them. */
export const FOUND: Found[] = [
  { id: "mistral/mistral-medium-latest", score: 78, tps: 95 },
  { id: "googleai/gemini-3.8-flash", score: 95, tps: 140 },
  { id: "groq/openai/gpt-oss-120b", score: 85, tps: 177 },
  { id: "groq/qwen/qwen3.8-27b", score: 80, tps: 310 },
  { id: "googleai/gemini-3.5-flash-lite", score: 80, tps: 337 },
  { id: "mistral/ministral-8b-2512", score: 65, tps: 220 },
];

const keyOf = (mode: Mode) => (mode === "smartest" ? "score" : "tps");

export function orderModels(models: Found[], ranked: boolean, mode: Mode): Found[] {
  if (!ranked) return models;
  const k = keyOf(mode);
  return [...models].sort((a, b) => b[k] - a[k]);
}

/** The models a request could go to: within 20% of the best. */
export function answering(ordered: Found[], mode: Mode): Set<string> {
  if (!ordered.length) return new Set();
  const k = keyOf(mode);
  const best = Math.max(...ordered.map((m) => m[k]));
  return new Set(ordered.filter((m) => m[k] >= best * 0.8).map((m) => m.id));
}

/** Positive = moved up since it was found. */
export function movement(id: string, ordered: Found[]): number {
  return FOUND.findIndex((m) => m.id === id) - ordered.findIndex((m) => m.id === id);
}
```

`src/components/story/screens/buckets.tsx`:
```tsx
"use client";

import { useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ListOrdered, Sparkles } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Segmented } from "@/components/ui/segmented";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { answering, FOUND, movement, orderModels, type Found, type Mode } from "./buckets-logic";

export function BucketsScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const [models, setModels] = useState<Found[]>([]);
  const [ranked, setRanked] = useState(false);
  const [mode, setMode] = useState<Mode>("smartest");
  const [add, setAdd] = useState(0);
  const [rank, setRank] = useState(0);

  useChoreo(trigger, [
    [300, () => setAdd(1)],
    [1700, () => setRank(1)],
    [3300, () => setMode("fastest")],
    [4700, () => setMode("smartest")],
  ]);

  const ordered = orderModels(models, ranked, mode);
  const live = answering(ordered, mode);
  const k = mode === "smartest" ? "score" : "tps";
  const best = ordered.length ? Math.max(...ordered.map((m) => m[k])) : 1;

  return (
    <>
      <div className="row-actions">
        <Button
          kind="primary"
          icon={Sparkles}
          label="Add models with AI"
          workingLabel="Looking"
          doneLabel={`Added ${FOUND.length}`}
          trigger={add}
          run={async () => {
            await simulate({ ms: 900 });
            setModels(FOUND);
          }}
        />
        <Button
          kind="test"
          icon={ListOrdered}
          label="Rank with AI"
          workingLabel="Ranking"
          doneLabel="Ranked"
          trigger={rank}
          disabled={!models.length}
          run={async () => {
            await simulate({ ms: 900 });
            setRanked(true);
          }}
        />
      </div>

      <Box
        title="smart"
        sub={models.length ? `${models.length} models · ${live.size} could answer now` : "no models yet"}
        action={
          <Segmented
            label="Rank by"
            value={mode}
            onChange={setMode}
            options={[
              { value: "smartest", label: "Smartest" },
              { value: "fastest", label: "Fastest" },
            ]}
          />
        }
        flush
      >
        {models.length === 0 ? (
          <p className="empty">No models yet. Add some with AI.</p>
        ) : (
          <LayoutGroup id="ladder">
            <ol className="ladder">
              {ordered.map((m, i) => {
                const mv = ranked ? movement(m.id, ordered) : 0;
                const on = live.has(m.id);
                return (
                  <motion.li
                    key={m.id}
                    layout={!reduce}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="ladder-row"
                    data-live={on || undefined}
                  >
                    <span className="ladder-n">{i + 1}</span>
                    <span className="ladder-id mono">
                      {m.id}
                      {mv !== 0 && (
                        <span className="move" data-dir={mv > 0 ? "up" : "down"}>
                          {mv > 0 ? `▲${mv}` : `▼${-mv}`}
                        </span>
                      )}
                    </span>
                    <Meter value={m[k]} max={best} cells={10} share />
                    <span className="ladder-v mono">{k === "score" ? m[k] : `${m[k]} t/s`}</span>
                    <span className="ladder-state">{on ? "would answer" : "outranked"}</span>
                  </motion.li>
                );
              })}
            </ol>
          </LayoutGroup>
        )}
      </Box>
      <p className="hint">A request goes to a random model within 20% of the best one that can answer, so the load spreads out.</p>
    </>
  );
}
```

- [ ] **Step 6: Wire them into `steps.tsx`**

Add imports at the top of `src/components/story/steps.tsx`:
```tsx
import { BucketsScreen } from "./screens/buckets";
import { WelcomeScreen } from "./screens/get-started-card";
import { ProvidersScreen } from "./screens/providers";
```
and replace `placeholder("Welcome")`, `placeholder("Providers")`, `placeholder("Buckets")` with `WelcomeScreen`, `ProvidersScreen`, `BucketsScreen`.

- [ ] **Step 7: Append the screen styles to `src/styles/story.css`**

```css
@layer components {
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 9px 0;
    border-bottom: 1px solid var(--color-rule);
    font-size: 13px;
  }
  .row:last-child {
    border-bottom: 0;
  }
  .row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .hint {
    margin: 0;
    font-size: 12.5px;
    color: var(--color-ink-3);
  }
  .empty {
    margin: 0;
    padding: 18px 14px;
    color: var(--color-ink-4);
    font: 500 12px var(--font-mono);
  }

  .seg {
    display: inline-flex;
    border: 1px solid var(--color-rule-2);
  }
  .seg-btn {
    position: relative;
    padding: 5px 10px;
    background: none;
    border: 0;
    color: var(--color-ink-3);
    font: 500 10px var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .seg-btn[aria-checked="true"] {
    color: var(--color-green);
  }
  .seg-bg {
    position: absolute;
    inset: 0;
    background: var(--color-green-wash);
    box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.45);
  }

  .gs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .gs-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    font-size: 13px;
    color: var(--color-ink-2);
  }
  .gs-tick {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex: none;
    border: 1px solid var(--color-rule-2);
    font: 600 10px var(--font-mono);
    color: var(--color-ink-4);
    transition:
      background-color 240ms var(--ease-soft),
      border-color 240ms var(--ease-soft),
      color 240ms var(--ease-soft);
  }
  .gs-item[data-done] {
    color: var(--color-ink);
  }
  .gs-item[data-done] .gs-tick {
    background: var(--color-green);
    border-color: var(--color-green);
    color: #000;
  }
  /* good news 1: the sweep, the ripple, the border that stays */
  .gs-complete {
    border-color: var(--color-green);
    overflow: hidden;
  }
  .gs-complete .box-body::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgba(52, 211, 153, 0.22) 50%, transparent 70%);
    animation: sweep 900ms var(--ease-soft) both;
  }
  .gs-complete .gs-tick {
    animation: tick-pop 420ms var(--ease-soft) both;
    animation-delay: calc(var(--i) * 70ms + 200ms);
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  .preset {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-raise);
    border: 1px solid var(--color-rule);
    color: var(--color-ink);
    font: 500 12.5px var(--font-mono);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 160ms var(--ease-soft),
      transform 160ms var(--ease-soft);
  }
  .preset:hover {
    border-color: var(--color-rule-2);
  }
  .preset[data-picked] {
    border-color: var(--color-green);
    box-shadow: 0 0 24px -10px rgba(52, 211, 153, 0.7);
  }

  .ladder {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ladder-row {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto 64px 92px;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--color-rule);
    background: var(--color-panel);
    font-size: 12.5px;
  }
  .ladder-row[data-live] {
    background: linear-gradient(90deg, var(--color-green-wash), transparent 60%);
  }
  .ladder-n {
    font: 600 11px var(--font-mono);
    color: var(--color-ink-4);
  }
  .ladder-id {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ladder-v {
    text-align: right;
    color: var(--color-ink-2);
  }
  .ladder-state {
    font: 500 10px var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-4);
  }
  .ladder-row[data-live] .ladder-state {
    color: var(--color-green);
  }
  .move {
    margin-left: 8px;
    font-size: 10.5px;
    animation: note-in 300ms var(--ease-soft);
  }
  .move[data-dir="up"] {
    color: var(--color-green);
  }
  .move[data-dir="down"] {
    color: var(--color-bad);
  }
  @media (max-width: 640px) {
    .ladder-row {
      grid-template-columns: 18px minmax(0, 1fr) 60px;
    }
    .ladder-row .meter,
    .ladder-state {
      display: none;
    }
  }
}

@keyframes sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes tick-pop {
  40% {
    transform: scale(1.35);
    box-shadow: 0 0 16px rgba(52, 211, 153, 0.8);
  }
}
```

`.gs-complete .box-body::after` needs `.box-body` to be positioned: add `position: relative;` to `.gs .box-body` in the same block:
```css
@layer components {
  .gs .box-body {
    position: relative;
  }
}
```

- [ ] **Step 8: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview: step 1 picks Groq (green edge), fills the key, Test key spins then ticks "Works", the pill turns Ready, a second key slides in. Step 2 adds six models, Rank reorders them with a spring and shows ▲/▼, the Smartest/Fastest highlight slides and the ladder reorders again. In free play both screens work by hand.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: story screens for Get started, Providers and Buckets"
```

---

### Task 11: Story screens 3 and 4 (Test all, traffic and failover)

**Files:**
- Create: `src/components/story/screens/test-all.tsx`, `screens/traffic-logic.ts`, `screens/traffic.tsx`, `screens/screens-b.test.tsx`
- Modify: `src/components/story/steps.tsx` (steps 3, 4), `src/styles/story.css` (append)

**Interfaces:**
- Consumes: `GetStartedCard` (Task 10), `FOUND` (Task 10), `Box`, `Meter`, `Pill` (Task 4), `Button`, `simulate`, `copyText` (Task 3), `useChoreo`, `ScreenProps` (Task 9).
- Produces:
  - `TestAllScreen`, `TrafficScreen`, `CURL`
  - `type Lane = { id: string; used: number; limit: number }`; `type Route = { kind: "ok" | "rotate" | "failover" | "none"; from?: string; to: string; ms: number }`; `START_LANES: Lane[]`; `KEY_SWITCH_AT = 27`; `routeOne(lanes: Lane[], n: number): { lanes: Lane[]; route: Route }`; `clock(n: number): string`

- [ ] **Step 1: Write the failing tests**

`src/components/story/screens/screens-b.test.tsx`:
```tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestAllScreen } from "./test-all";
import { clock, KEY_SWITCH_AT, routeOne, START_LANES, type Lane } from "./traffic-logic";

function run(n: number, lanes: Lane[] = START_LANES) {
  const routes = [];
  let cur = lanes;
  for (let i = 1; i <= n; i++) {
    const r = routeOne(cur, i);
    cur = r.lanes;
    routes.push(r.route);
  }
  return { lanes: cur, routes };
}

describe("routeOne", () => {
  it("sends to the first lane with room", () => {
    const { lanes, routes } = run(1);
    expect(routes[0]).toMatchObject({ kind: "ok", to: "groq" });
    expect(lanes[0].used).toBe(START_LANES[0].used + 1);
  });
  it("switches to key 2 when key 1 hits its limit", () => {
    const n = KEY_SWITCH_AT - START_LANES[0].used;
    expect(run(n).routes[n - 1].kind).toBe("rotate");
  });
  it("fails over to the next provider once the first is full", () => {
    const full = START_LANES[0].limit - START_LANES[0].used;
    const { routes } = run(full + 1);
    expect(routes[full]).toMatchObject({ kind: "failover", from: "groq", to: "googleai" });
  });
  it("reports nothing answered when every lane is full", () => {
    const full = START_LANES.map((l) => ({ ...l, used: l.limit }));
    expect(routeOne(full, 1).route.kind).toBe("none");
  });
  it("formats a clock time", () => {
    expect(clock(3)).toBe("09:06:13");
  });
});

describe("TestAllScreen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("tests every model, then completes Get started", async () => {
    render(<TestAllScreen trigger={1} />);
    // Test all starts at 300 ms and takes 6 x 180 ms; its done label shows for 1.8 s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText("All 6 work")).toBeInTheDocument();
    // Copy curl is pressed at 2600 ms and takes 250 ms.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText("5 of 5 done")).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/story/screens/screens-b.test.tsx`
Expected: FAIL, cannot resolve `./test-all`.

- [ ] **Step 2: Write the Test all screen**

`src/components/story/screens/test-all.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Copy, Zap } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill } from "@/components/ui/pill";
import { copyText } from "@/lib/copy";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { FOUND } from "./buckets-logic";
import { GetStartedCard } from "./get-started-card";

export const CURL = `curl http://localhost:4891/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "smart", "messages": [{"role": "user", "content": "hi"}]}'`;

export function TestAllScreen({ trigger }: ScreenProps) {
  const [tested, setTested] = useState(0);
  const [wave, setWave] = useState(0);
  const [done, setDone] = useState(3);
  const [celebrate, setCelebrate] = useState(false);
  const [test, setTest] = useState(0);
  const [copy, setCopy] = useState(0);

  useChoreo(trigger, [
    [300, () => setTest(1)],
    [2600, () => setCopy(1)],
  ]);

  return (
    <>
      <GetStartedCard done={done} celebrate={celebrate} />
      <Box
        title="Test all"
        sub="says hi to every model once, about 512 tokens"
        action={
          <Button
            kind="test"
            icon={Zap}
            label="Test all"
            workingLabel={`Testing ${tested} of ${FOUND.length}`}
            doneLabel={`All ${FOUND.length} work`}
            trigger={test}
            run={async () => {
              setTested(0);
              for (let i = 1; i <= FOUND.length; i++) {
                await simulate({ ms: 180 });
                setTested(i);
              }
              setWave((w) => w + 1);
              setDone((d) => Math.max(d, 4));
            }}
          />
        }
      >
        <Meter value={tested} max={FOUND.length} cells={18} wave={wave} label="Models tested" />
        <ul className="test-list">
          {FOUND.map((m, i) => (
            <li key={m.id}>
              <span className="mono">{m.id}</span>
              {i < tested ? <Pill status="ready" /> : <span className="text-ink-4 mono text-xs">not tested</span>}
            </li>
          ))}
        </ul>
      </Box>
      <Box
        title="Point your app at it"
        action={
          <Button
            kind="copy"
            icon={Copy}
            label="Copy curl"
            doneLabel="Copied"
            trigger={copy}
            run={async (source) => {
              if (source === "user") await copyText(CURL);
              else await simulate({ ms: 250 });
              setDone(5);
              setCelebrate(true);
            }}
          />
        }
      >
        <pre className="code-line">
          <code>{CURL}</code>
        </pre>
      </Box>
    </>
  );
}
```

- [ ] **Step 3: Write the traffic logic**

`src/components/story/screens/traffic-logic.ts`:
```ts
export type Lane = { id: string; used: number; limit: number };
export type Route = { kind: "ok" | "rotate" | "failover" | "none"; from?: string; to: string; ms: number };

/** Requests per minute, per model, in bucket "smart". groq's key 1 is used up at 27; key 2 carries it to 30. */
export const START_LANES: Lane[] = [
  { id: "groq/openai/gpt-oss-120b", used: 24, limit: 30 },
  { id: "googleai/gemini-3.8-flash", used: 6, limit: 60 },
  { id: "mistral/mistral-medium-latest", used: 3, limit: 60 },
];
export const KEY_SWITCH_AT = 27;

const provider = (id: string) => id.split("/")[0];

export function routeOne(lanes: Lane[], n: number): { lanes: Lane[]; route: Route } {
  const i = lanes.findIndex((l) => l.used < l.limit);
  const ms = 380 + ((n * 137) % 900);
  if (i === -1) return { lanes, route: { kind: "none", to: "nothing answered", ms: 0 } };
  const next = lanes.map((l, k) => (k === i ? { ...l, used: l.used + 1 } : l));
  if (i > 0) {
    return { lanes: next, route: { kind: "failover", from: provider(lanes[0].id), to: provider(lanes[i].id), ms } };
  }
  if (next[0].used === KEY_SWITCH_AT) return { lanes: next, route: { kind: "rotate", to: provider(lanes[0].id), ms } };
  return { lanes: next, route: { kind: "ok", to: provider(lanes[0].id), ms } };
}

export function clock(n: number): string {
  return `09:06:${String(10 + n).padStart(2, "0")}`;
}
```

Run: `npm test -- src/components/story/screens/screens-b.test.tsx`
Expected: the `routeOne` and `clock` tests PASS; `TestAllScreen` PASSES too.

- [ ] **Step 4: Write the traffic screen**

`src/components/story/screens/traffic.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill } from "@/components/ui/pill";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { clock, KEY_SWITCH_AT, routeOne, START_LANES, type Lane, type Route } from "./traffic-logic";

type Row = Route & { n: number };

export function TrafficScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const lanesRef = useRef<Lane[]>(START_LANES);
  const n = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [lanes, setLanes] = useState<Lane[]>(START_LANES);
  const [rows, setRows] = useState<Row[]>([]);

  const tick = useCallback(() => {
    n.current += 1;
    const { lanes: next, route } = routeOne(lanesRef.current, n.current);
    lanesRef.current = next;
    setLanes(next);
    setRows((rs) => [{ ...route, n: n.current }, ...rs].slice(0, 6));
  }, []);

  const send = useCallback(
    (count: number) => {
      clearInterval(timer.current);
      let left = count;
      timer.current = setInterval(() => {
        tick();
        left -= 1;
        if (left <= 0) clearInterval(timer.current);
      }, 260);
    },
    [tick],
  );

  useEffect(() => () => clearInterval(timer.current), []);
  useChoreo(trigger, [[300, () => send(12)]]);

  const groq = lanes[0];
  const keyN = groq.used >= KEY_SWITCH_AT ? 2 : 1;

  return (
    <>
      <Box
        title="Bucket smart"
        sub="requests this minute"
        action={
          <Button
            kind="primary"
            size="sm"
            icon={Send}
            label="Send 10 requests"
            workingLabel="Sending"
            doneLabel="Sent"
            run={async () => {
              send(10);
              await simulate({ ms: 2700 });
            }}
          />
        }
      >
        {lanes.map((l, i) => {
          const full = l.used >= l.limit;
          return (
            <div key={l.id} className="row lane-row">
              <span className="mono lane-id">
                {l.id}
                {i === 0 && <span className="lane-key">key {keyN} of 2</span>}
              </span>
              <Meter value={l.used} max={l.limit} label={`${l.id} requests this minute`} />
              <span className="mono lane-n">
                {l.used}/{l.limit}
              </span>
              {full ? <Pill status="busy" countdown={42} /> : <Pill status="ready" />}
            </div>
          );
        })}
      </Box>

      <Box title="Last requests" sub="newest first" flush>
        {rows.length === 0 ? (
          <p className="empty">No requests yet.</p>
        ) : (
          <ul className="log">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.li
                  key={r.n}
                  className="log-row"
                  data-kind={r.kind}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, backgroundColor: "rgba(52,211,153,0.12)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="mono text-ink-4">{clock(r.n)}</span>
                  <span className="mono">smart</span>
                  <span className="mono log-path">
                    {r.kind === "failover" && (
                      <>
                        {r.from} → {r.to} <span className="text-blue">↻ failover</span>
                      </>
                    )}
                    {r.kind === "rotate" && (
                      <>
                        {r.to} · key 1 → key 2
                      </>
                    )}
                    {(r.kind === "ok" || r.kind === "none") && r.to}
                  </span>
                  <span className="mono text-ink-3">{r.ms ? `${r.ms.toLocaleString("en-US")} ms` : "-"}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Box>
    </>
  );
}
```

- [ ] **Step 5: Wire them into `steps.tsx`**

Add:
```tsx
import { TestAllScreen } from "./screens/test-all";
import { TrafficScreen } from "./screens/traffic";
```
and replace `placeholder("Test all")` and `placeholder("Traffic")` with `TestAllScreen` and `TrafficScreen`.

- [ ] **Step 6: Append the styles to `src/styles/story.css`**

```css
@layer components {
  .test-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .test-list li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12.5px;
  }
  .code-line {
    margin: 0;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-ink-2);
  }

  .lane-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 48px 150px;
  }
  .lane-id {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lane-key {
    font-size: 11px;
    color: var(--color-ink-4);
  }
  .lane-n {
    text-align: right;
    color: var(--color-ink-2);
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 640px) {
    .lane-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .lane-row .meter {
      grid-column: 1 / -1;
    }
    .lane-n {
      display: none;
    }
  }

  .log {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .log-row {
    display: grid;
    grid-template-columns: 70px 50px minmax(0, 1fr) 72px;
    gap: 10px;
    padding: 7px 14px;
    border-bottom: 1px solid var(--color-rule);
    font-size: 12px;
  }
  .log-row[data-kind="failover"] {
    box-shadow: inset 2px 0 0 var(--color-blue);
  }
  .log-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 640px) {
    .log-row {
      grid-template-columns: 62px minmax(0, 1fr) 64px;
    }
    .log-row > :nth-child(2) {
      display: none;
    }
  }
}
```

- [ ] **Step 7: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview: step 3 plays the Test all counter ("Testing 3 of 6"), the meter cells wave, "All 6 work", then Copy curl and the Get started sweep with rippling ticks. Step 4 streams requests; the groq meter goes amber then red, the key label flips to "key 2 of 2", groq turns ◐ Busy with a live countdown, and a blue-edged "groq → googleai ↻ failover" row slides in.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: story screens for Test all and failover traffic"
```

---

### Task 12: Story screens 5 and 6 (request journey, status and fixes)

**Files:**
- Create: `src/components/story/screens/request.tsx`, `screens/status-logic.ts`, `screens/status.tsx`, `screens/screens-c.test.tsx`
- Modify: `src/components/story/steps.tsx` (steps 5, 6), `src/styles/story.css` (append)

**Interfaces:**
- Consumes: `Box`, `Pill`, `Meter`, `type Status` (Task 4); `Fold`, `Sheet` (Task 5); `Button`, `simulate`, `copyText` (Task 3); `useChoreo`, `ScreenProps` (Task 9).
- Produces:
  - `RequestScreen`, `StatusScreen`
  - `type StatusRow = { id: string; status: Status; reason: string; fix: string; brain?: { verdict: string; sure: number }; gone?: boolean }`; `START_ROWS`, `START_READY = 4`; `counts(rows, extraReady): Record<Status, number>`; `settle(rows, id): StatusRow[]`; `retire(rows, id): StatusRow[]`

- [ ] **Step 1: Write the failing tests**

`src/components/story/screens/screens-c.test.tsx`:
```tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestScreen } from "./request";
import { StatusScreen } from "./status";
import { counts, retire, settle, START_READY, START_ROWS } from "./status-logic";

describe("status logic", () => {
  it("counts rows by status on top of the ready ones", () => {
    const c = counts(START_ROWS, START_READY);
    expect(c).toMatchObject({ ready: 4, needs: 1, struggling: 1 });
  });
  it("settles a row to ready, then retires it", () => {
    const settled = settle(START_ROWS, "mistral/mistral-large-2512");
    expect(counts(settled, START_READY)).toMatchObject({ ready: 5, needs: 0 });
    expect(retire(settled, "mistral/mistral-large-2512")[0].gone).toBe(true);
  });
});

describe("screens", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens the request sheet with its journey", async () => {
    render(<RequestScreen trigger={1} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.getByRole("dialog", { name: "Request req_6565bd6b" })).toBeInTheDocument();
    expect(screen.getByText("Tried first").closest("details")!.open).toBe(true);
  });

  it("fixes the row that needs you and says so", async () => {
    render(<StatusScreen trigger={1} />);
    expect(screen.getByText("Not on your Mistral plan.")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText("Nothing needs you.")).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/story/screens/screens-c.test.tsx`
Expected: FAIL, cannot resolve `./request`.

- [ ] **Step 2: Write the request screen**

`src/components/story/screens/request.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Fold } from "@/components/ui/fold";
import { Pill } from "@/components/ui/pill";
import { Sheet } from "@/components/ui/sheet";
import { copyText } from "@/lib/copy";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

const ROWS = [
  { id: "req_6565bd6b", time: "09:06:11", path: "groq → googleai", ms: "1,204 ms", failover: true },
  { id: "req_052290bd", time: "09:06:09", path: "groq · key 2", ms: "612 ms", failover: false },
  { id: "req_1f933a04", time: "09:06:05", path: "groq", ms: "480 ms", failover: false },
];

export function RequestScreen({ trigger }: ScreenProps) {
  const [open, setOpen] = useState(false);
  const [tried, setTried] = useState(0);
  const [think, setThink] = useState(0);
  const [copy, setCopy] = useState(0);

  useChoreo(trigger, [
    [400, () => setOpen(true)],
    [1100, () => setTried(1)],
    [1900, () => setThink(1)],
    [2700, () => setCopy(1)],
  ]);

  return (
    <>
      <Box title="Requests" sub="click one to see its journey" flush>
        <ul className="log">
          {ROWS.map((r) => (
            <li key={r.id}>
              <button type="button" className="log-row log-button" data-kind={r.failover ? "failover" : "ok"} onClick={() => setOpen(true)}>
                <span className="mono text-ink-4">{r.time}</span>
                <span className="mono">smart</span>
                <span className="mono log-path">
                  {r.path} {r.failover && <span className="text-blue">↻</span>}
                </span>
                <span className="mono text-ink-3">{r.ms}</span>
              </button>
            </li>
          ))}
        </ul>
      </Box>

      <Sheet open={open} onClose={() => setOpen(false)} title="Request req_6565bd6b">
        <div className="rq-line">
          <Pill status="ready" /> answered by <span className="mono">googleai/gemini-3.8-flash</span>
        </div>
        <div className="mono text-xs text-ink-3">smart · 1,204 ms · 82 in / 64 out · $0.00</div>
        <Fold summary="Tried first" note="1 attempt" trigger={tried}>
          <p className="rq-wait mono">
            groq/openai/gpt-oss-120b · 429 Rate limit reached for requests per minute · moved on at once, no waiting
          </p>
        </Fold>
        <div className="rq-convo">
          <p>
            <span className="label">you</span>
            Summarise this changelog in two lines.
          </p>
          <p>
            <span className="label">model</span>
            Failover no longer waits between tries. Errors now show the provider&apos;s own message and a request ID.
          </p>
        </div>
        <Fold summary="Thinking" note="312 tokens" trigger={think}>
          <p className="text-ink-3">Two lines. The changelog has two themes: faster failover and clearer errors.</p>
        </Fold>
        <Button
          kind="copy"
          icon={Copy}
          label="Copy request ID"
          doneLabel="Copied"
          trigger={copy}
          run={async (source) => {
            if (source === "user") await copyText("req_6565bd6b");
            else await simulate({ ms: 250 });
          }}
        />
      </Sheet>
    </>
  );
}
```

- [ ] **Step 3: Write the status logic**

`src/components/story/screens/status-logic.ts`:
```ts
import type { Status } from "@/components/ui/pill";

export type StatusRow = {
  id: string;
  status: Status;
  reason: string;
  fix: string;
  brain?: { verdict: string; sure: number };
  gone?: boolean;
};

export const START_ROWS: StatusRow[] = [
  {
    id: "mistral/mistral-large-2512",
    status: "needs",
    reason: "Not on your Mistral plan.",
    fix: "Use mistral-small instead",
    brain: { verdict: "not on your plan", sure: 92 },
  },
  {
    id: "googleai/gemma-4-31b-it",
    status: "struggling",
    reason: "Slow replies: 31 s median.",
    fix: "Retry",
  },
];
export const START_READY = 4;

export function counts(rows: StatusRow[], extraReady: number): Record<Status, number> {
  const c: Record<Status, number> = { ready: extraReady, busy: 0, struggling: 0, needs: 0, off: 0 };
  for (const r of rows) c[r.status] += 1;
  return c;
}

export function settle(rows: StatusRow[], id: string): StatusRow[] {
  return rows.map((r) => (r.id === id ? { ...r, status: "ready" } : r));
}

export function retire(rows: StatusRow[], id: string): StatusRow[] {
  return rows.map((r) => (r.id === id ? { ...r, gone: true } : r));
}
```

- [ ] **Step 4: Write the status screen (good-news moments 3 and 4)**

`src/components/story/screens/status.tsx`:
```tsx
"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Pill, STATUS } from "@/components/ui/pill";
import { simulate } from "@/lib/sim";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";
import { counts, retire, settle, START_READY, START_ROWS } from "./status-logic";

type Fly = { key: number; x: number; y: number; dx: number; dy: number };

export function StatusScreen({ trigger }: ScreenProps) {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState(START_ROWS);
  const [fix, setFix] = useState(0);
  const [retry, setRetry] = useState(0);
  const [fly, setFly] = useState<Fly | null>(null);
  const [pop, setPop] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLSpanElement>(null);
  const pills = useRef<Record<string, HTMLSpanElement | null>>({});
  const flights = useRef(0);

  useChoreo(trigger, [
    [600, () => setFix(1)],
    [2800, () => setRetry(1)],
  ]);

  const c = counts(rows, START_READY);

  const settleRow = (id: string) => {
    const from = pills.current[id];
    const to = chip.current;
    const box = wrap.current;
    if (from && to && box && !reduce) {
      const b = box.getBoundingClientRect();
      const scale = b.width / box.offsetWidth || 1; // the story card may be scaled
      const f = from.getBoundingClientRect();
      const t = to.getBoundingClientRect();
      flights.current += 1;
      setFly({
        key: flights.current,
        x: (f.left - b.left) / scale,
        y: (f.top - b.top) / scale,
        dx: (t.left - f.left) / scale,
        dy: (t.top - f.top) / scale,
      });
    }
    setRows((rs) => settle(rs, id));
    setTimeout(() => setPop((p) => p + 1), reduce ? 0 : 520);
    setTimeout(() => setRows((rs) => retire(rs, id)), 1100);
  };

  return (
    <div ref={wrap} className="st">
      <div className="st-chips" aria-label="Summary">
        {(["ready", "struggling", "needs"] as const).map((s) => (
          <span key={s} className="st-chip" data-status={s} ref={s === "ready" ? chip : undefined}>
            <span aria-hidden>{STATUS[s].glyph}</span>
            <motion.span
              key={s === "ready" ? pop : 0}
              className="st-n"
              initial={s === "ready" && pop > 0 && !reduce ? { scale: 1.6, color: "#6ee7b7" } : false}
              animate={{ scale: 1, color: "currentColor" }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
            >
              {c[s]}
            </motion.span>
            {STATUS[s].word.toLowerCase()}
          </span>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {rows
          .filter((r) => !r.gone)
          .map((r) => (
            <motion.div
              key={r.id}
              layout={!reduce}
              className="st-row"
              data-status={r.status}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                ref={(el) => {
                  pills.current[r.id] = el;
                }}
              >
                <Pill key={r.status} status={r.status} />
              </span>
              <div className="st-main">
                <span className="mono">{r.id}</span>
                <span className="st-reason">{r.reason}</span>
                {r.brain && (
                  <span className="st-brain">
                    Error brain: {r.brain.verdict}, {r.brain.sure}% sure
                    <Meter value={r.brain.sure} max={100} cells={10} share label="Error brain confidence" />
                  </span>
                )}
              </div>
              <Button
                kind="fix"
                icon={r.fix === "Retry" ? RefreshCw : Wrench}
                label={r.fix}
                workingLabel={r.fix === "Retry" ? "Retrying" : "Switching"}
                doneLabel={r.fix === "Retry" ? "Answered" : "Fixed"}
                trigger={r.status === "needs" ? fix : r.status === "struggling" ? retry : 0}
                run={async () => {
                  await simulate({ ms: 900 });
                  settleRow(r.id);
                }}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {c.needs === 0 && (
          <motion.div
            className="st-clear"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <svg viewBox="0 0 24 24" className="st-clear-tick" aria-hidden>
              <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" pathLength={1} />
            </svg>
            Nothing needs you.
          </motion.div>
        )}
      </AnimatePresence>

      {fly && (
        <motion.span
          key={fly.key}
          className="st-fly"
          style={{ left: fly.x, top: fly.y }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: fly.dx, y: fly.dy, scale: 0.6, opacity: [1, 1, 0] }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          onAnimationComplete={() => setFly(null)}
          aria-hidden
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Wire them into `steps.tsx`**

Add:
```tsx
import { RequestScreen } from "./screens/request";
import { StatusScreen } from "./screens/status";
```
and replace `placeholder("Request")` and `placeholder("Status")` with `RequestScreen` and `StatusScreen`.

- [ ] **Step 6: Append the styles to `src/styles/story.css`**

```css
@layer components {
  .log-button {
    width: 100%;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--color-rule);
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .log-button:hover {
    background: var(--color-raise);
  }
  .rq-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
  }
  .rq-wait {
    margin: 0;
    font-size: 12px;
    color: var(--color-ink-2);
  }
  .rq-convo {
    display: grid;
    gap: 8px;
    font-size: 13px;
  }
  .rq-convo p {
    margin: 0;
    display: grid;
    gap: 2px;
  }

  .st {
    position: relative;
    display: grid;
    gap: 10px;
  }
  .st-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .st-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid var(--color-rule-2);
    font: 500 11px var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .st-chip[data-status="ready"] {
    color: var(--color-green);
  }
  .st-chip[data-status="struggling"] {
    color: var(--color-hot);
  }
  .st-chip[data-status="needs"] {
    color: var(--color-bad);
  }
  .st-n {
    display: inline-block;
    font-variant-numeric: tabular-nums;
  }
  .st-row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--color-panel);
    border: 1px solid var(--color-rule);
    overflow: hidden;
  }
  .st-row[data-status="needs"] {
    box-shadow: inset 2px 0 0 var(--color-bad);
  }
  .st-row[data-status="struggling"] {
    box-shadow: inset 2px 0 0 var(--color-hot);
  }
  .st-row[data-status="ready"] {
    box-shadow: inset 2px 0 0 var(--color-green);
  }
  /* good news 3: the glyph spins into a green dot */
  .st-row[data-status="ready"] .pill-dot {
    animation: spin-in 480ms var(--ease-soft);
  }
  .st-main {
    display: grid;
    gap: 3px;
    min-width: 0;
    font-size: 12.5px;
  }
  .st-reason {
    color: var(--color-ink-2);
  }
  .st-brain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font: 500 11px var(--font-mono);
    color: var(--color-violet);
  }
  .st-fly {
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--color-green);
    box-shadow: 0 0 14px var(--color-green);
    z-index: 10;
    pointer-events: none;
  }
  /* good news 4: the tick draws and glows once */
  .st-clear {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--color-green);
    color: var(--color-green);
    font: 600 13px var(--font-mono);
    animation: glow-once 1.2s var(--ease-soft);
  }
  .st-clear-tick {
    width: 18px;
    height: 18px;
  }
  .st-clear-tick path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: lane-draw 500ms var(--ease-soft) 300ms forwards;
  }
  @media (max-width: 640px) {
    .st-row {
      grid-template-columns: 1fr;
    }
  }
}

@keyframes spin-in {
  from {
    transform: rotate(-180deg) scale(0.4);
  }
}
@keyframes glow-once {
  30% {
    box-shadow: 0 0 32px -4px rgba(52, 211, 153, 0.7);
  }
}
```

- [ ] **Step 7: Run tests, lint, build, look**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview: step 5 slides the sheet in from the right, opens Tried first, then Thinking, then Copy request ID ticks. Step 6: "Use mistral-small instead" spins, the ▲ spins into a green ●, a small green square flies into the Ready chip, which pops from 4 to 5, the row collapses, and "Nothing needs you." draws its tick and glows once; then Retry on the Struggling row does the same. Reduced motion: no flight, no spin, colours and words still change.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: story screens for the request journey and the status list"
```

---

### Task 13: Story screens 7 and 8 (change by hand, allowance) and free play

**Files:**
- Create: `src/components/story/drag.ts`, `src/components/story/drag-board.tsx`, `src/components/story/screens/tweak.tsx`, `screens/allowance.tsx`, `screens/screens-d.test.tsx`
- Modify: `src/components/story/steps.tsx` (steps 7, 8; delete `placeholder`), `src/styles/story.css` (append)

**Interfaces:**
- Consumes: `Box`, `Pill`, `Meter`, `StackedBar`, `CountUp`, `Countdown`, `Tag` (Task 4); `Toggle`, `Fold`, `useToast` (Task 5); `Button`, `simulate` (Task 3); `useChoreo`, `ScreenProps` (Task 9).
- Produces:
  - `type Board = { picked: string | null; buckets: Record<string, string[]> }`; `type DragAction = { type: "pick"; id: string } | { type: "drop"; bucket: string } | { type: "cancel" }`; `dragReducer(state, action): Board`
  - `<DragBoard initial trigger move={{ id, to }} />` (drag, tap then tap, or Enter then Enter)
  - `TweakScreen`, `AllowanceScreen`

- [ ] **Step 1: Write the failing tests**

`src/components/story/screens/screens-d.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DragBoard } from "../drag-board";
import { dragReducer, type Board } from "../drag";
import { AllowanceScreen } from "./allowance";

const start: Board = { picked: null, buckets: { smart: ["a", "b"], fast: ["c"] } };

describe("dragReducer", () => {
  it("picks and drops into another bucket", () => {
    const picked = dragReducer(start, { type: "pick", id: "a" });
    expect(picked.picked).toBe("a");
    const dropped = dragReducer(picked, { type: "drop", bucket: "fast" });
    expect(dropped).toEqual({ picked: null, buckets: { smart: ["b"], fast: ["c", "a"] } });
  });
  it("unpicks when the same card is picked twice", () => {
    const s = dragReducer(dragReducer(start, { type: "pick", id: "a" }), { type: "pick", id: "a" });
    expect(s.picked).toBeNull();
  });
  it("ignores a drop with nothing picked, and cancel clears the pick", () => {
    expect(dragReducer(start, { type: "drop", bucket: "fast" })).toBe(start);
    expect(dragReducer({ ...start, picked: "a" }, { type: "cancel" }).picked).toBeNull();
  });
});

describe("DragBoard", () => {
  it("moves a card by tap, then tap", () => {
    render(<DragBoard initial={{ smart: ["googleai/gemma-4-26b"], fast: [] }} trigger={0} move={{ id: "", to: "" }} />);
    fireEvent.click(screen.getByRole("button", { name: /gemma-4-26b/ }));
    fireEvent.click(screen.getByRole("button", { name: /fast/ }));
    const fast = screen.getByRole("button", { name: /fast/ }).closest(".drag-zone")!;
    expect(fast).toHaveTextContent("googleai/gemma-4-26b");
  });
});

describe("AllowanceScreen", () => {
  it("shows the total and marks where each number comes from", () => {
    render(<AllowanceScreen trigger={0} />);
    expect(screen.getByText("32,866")).toBeInTheDocument();
    expect(screen.getAllByText("Your limit").length).toBeGreaterThan(0);
    expect(screen.getByText("Groq says")).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/story/screens/screens-d.test.tsx`
Expected: FAIL, cannot resolve `../drag-board`.

- [ ] **Step 2: Write the drag reducer and board**

`src/components/story/drag.ts`:
```ts
export type Board = { picked: string | null; buckets: Record<string, string[]> };
export type DragAction = { type: "pick"; id: string } | { type: "drop"; bucket: string } | { type: "cancel" };

export function dragReducer(state: Board, action: DragAction): Board {
  switch (action.type) {
    case "pick":
      return { ...state, picked: state.picked === action.id ? null : action.id };
    case "cancel":
      return { ...state, picked: null };
    case "drop": {
      if (!state.picked) return state;
      const id = state.picked;
      const buckets: Record<string, string[]> = {};
      for (const [name, ids] of Object.entries(state.buckets)) buckets[name] = ids.filter((x) => x !== id);
      buckets[action.bucket] = [...(buckets[action.bucket] ?? []), id];
      return { picked: null, buckets };
    }
  }
}
```

`src/components/story/drag-board.tsx`:
```tsx
"use client";

import { useReducer, useRef } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { dragReducer } from "./drag";
import { useChoreo } from "./use-choreo";

/** Model cards and buckets. Three ways in: drag it, tap then tap, or Enter then Enter. */
export function DragBoard({
  initial,
  trigger,
  move,
}: {
  initial: Record<string, string[]>;
  trigger: number;
  move: { id: string; to: string };
}) {
  const reduce = useReducedMotion();
  const [board, dispatch] = useReducer(dragReducer, { picked: null, buckets: initial });
  const zones = useRef<Record<string, HTMLDivElement | null>>({});
  const dragged = useRef(false);

  useChoreo(trigger, [
    [0, () => dispatch({ type: "pick", id: move.id })],
    [600, () => dispatch({ type: "drop", bucket: move.to })],
  ]);

  const dropAt = (x: number, y: number) => {
    for (const [name, el] of Object.entries(zones.current)) {
      const r = el?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        dispatch({ type: "drop", bucket: name });
        return;
      }
    }
    dispatch({ type: "cancel" });
  };

  return (
    <LayoutGroup id="drag">
      <div className="drag-board">
        {Object.entries(board.buckets).map(([name, ids]) => (
          <div
            key={name}
            ref={(el) => {
              zones.current[name] = el;
            }}
            className="drag-zone"
            data-armed={(board.picked !== null && !ids.includes(board.picked)) || undefined}
          >
            <button
              type="button"
              className="drag-zone-head"
              disabled={!board.picked}
              onClick={() => dispatch({ type: "drop", bucket: name })}
            >
              <span className="label">{name}</span>
              {board.picked && !ids.includes(board.picked) && <span className="drag-hint">drop here</span>}
            </button>
            <ul>
              {ids.map((id) => (
                <motion.li key={id} layoutId={reduce ? undefined : `card-${id}`} layout={!reduce}>
                  <motion.button
                    type="button"
                    className="drag-card"
                    data-picked={board.picked === id || undefined}
                    drag={!reduce}
                    dragSnapToOrigin
                    dragMomentum={false}
                    whileDrag={{ scale: 1.04, zIndex: 20, boxShadow: "0 12px 30px -8px rgba(52,211,153,0.5)" }}
                    onDragStart={() => {
                      dragged.current = true;
                      dispatch({ type: "pick", id });
                    }}
                    onDragEnd={(_, info) => dropAt(info.point.x - window.scrollX, info.point.y - window.scrollY)}
                    onClick={() => {
                      if (dragged.current) {
                        dragged.current = false;
                        return;
                      }
                      dispatch({ type: "pick", id });
                    }}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-ink-4" aria-hidden />
                    {id}
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LayoutGroup>
  );
}
```

- [ ] **Step 3: Write the tweak screen**

`src/components/story/screens/tweak.tsx`:
```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Save, Trash2 } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { simulate } from "@/lib/sim";
import { DragBoard } from "../drag-board";
import type { ScreenProps } from "../steps";
import { useChoreo } from "../use-choreo";

type Cues = { drag: number; toggle: number; save: number; remove: number };

export function TweakScreen({ trigger }: ScreenProps) {
  const toast = useToast();
  const tries = useRef(0);
  const toastId = useRef(0);
  const [nvidia, setNvidia] = useState(false);
  const [giveUp, setGiveUp] = useState("30");
  const [saved, setSaved] = useState("30");
  const [removed, setRemoved] = useState(false);
  const [cue, setCue] = useState<Cues>({ drag: 0, toggle: 0, save: 0, remove: 0 });
  const bump = (k: keyof Cues) => setCue((s) => ({ ...s, [k]: s[k] + 1 }));
  const restore = useCallback(() => setRemoved(false), []);

  useChoreo(trigger, [
    [300, () => bump("drag")],
    [1500, () => bump("toggle")],
    [2700, () => bump("toggle")],
    [3700, () => setGiveUp("45")],
    [4100, () => bump("save")],
    [5200, () => bump("remove")],
    [
      6900,
      () => {
        restore();
        toast.dismiss(toastId.current);
      },
    ],
  ]);

  return (
    <>
      <Box title="Buckets" sub="drag a model, or tap it and then a bucket">
        <DragBoard
          initial={{ smart: ["googleai/gemma-4-26b", "googleai/gemini-3.8-flash"], fast: ["groq/openai/gpt-oss-20b"] }}
          trigger={cue.drag}
          move={{ id: "googleai/gemma-4-26b", to: "fast" }}
        />
      </Box>

      <div className="tweak-grid">
        <Box title="Providers">
          <div className="row">
            <span className="flex items-center gap-3">
              <span className="mono">nvidia</span>
              <Pill status={nvidia ? "ready" : "off"} />
            </span>
            <Toggle
              label="nvidia"
              trigger={cue.toggle}
              onChange={setNvidia}
              save={async () => {
                tries.current += 1;
                await simulate({ ms: 400, fail: tries.current === 1, reason: "Couldn't save: the settings file is busy" });
              }}
            />
          </div>
        </Box>

        <Box title="Retries">
          <div className="row">
            <label className="flex items-center gap-2 text-sm">
              Give up after
              <input
                className="field w-16"
                inputMode="numeric"
                value={giveUp}
                onChange={(e) => setGiveUp(e.target.value.replace(/\D/g, ""))}
              />
              seconds
            </label>
            <Button
              kind="primary"
              icon={Save}
              label="Save"
              workingLabel="Saving"
              doneLabel="Saved"
              disabled={giveUp === saved}
              trigger={cue.save}
              run={async () => {
                await simulate({ ms: 600 });
                setSaved(giveUp);
              }}
            />
          </div>
        </Box>
      </div>

      <Box title="Models in fast" flush>
        <ul className="log">
          <AnimatePresence initial={false}>
            {!removed && (
              <motion.li
                key="ministral"
                className="row px-3.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="mono">mistral/ministral-3b-2512</span>
                <Button
                  kind="danger"
                  size="sm"
                  icon={Trash2}
                  label="Remove"
                  workingLabel="Removing"
                  trigger={cue.remove}
                  run={async () => {
                    await simulate({ ms: 400 });
                    setRemoved(true);
                    toastId.current = toast.push({
                      text: "Removed mistral/ministral-3b-2512",
                      action: { label: "Undo", onAction: restore },
                      ms: 6000,
                    });
                  }}
                />
              </motion.li>
            )}
          </AnimatePresence>
          <li className="row px-3.5">
            <span className="mono">groq/openai/gpt-oss-20b</span>
            <Pill status="ready" />
          </li>
        </ul>
      </Box>
    </>
  );
}
```

The "Save" button is disabled until the value changes, but its `trigger` still runs it (the story changes the value at 3700 ms first).

- [ ] **Step 4: Write the allowance screen**

`src/components/story/screens/allowance.tsx`:
```tsx
"use client";

import { Box } from "@/components/ui/box";
import { CountUp } from "@/components/ui/count-up";
import { Countdown } from "@/components/ui/countdown";
import { Fold } from "@/components/ui/fold";
import { Meter } from "@/components/ui/meter";
import { StackedBar } from "@/components/ui/stacked-bar";
import { Tag } from "@/components/ui/tag";
import type { ScreenProps } from "../steps";

type Limit =
  | { model: string; what: string; used: number; limit: number; src: "Your limit"; resets: number }
  | { model: string; what: string; left: string; src: string; resets: number };

function LimitRow({ l }: { l: Limit }) {
  return (
    <div className="lim-row">
      <div className="lim-name">
        <span className="mono">{l.model}</span>
        <span className="label">{l.what}</span>
      </div>
      <Tag tone={l.src === "Your limit" ? "limit" : "provider"}>{l.src}</Tag>
      {"limit" in l ? (
        <span className="lim-meter">
          <Meter value={l.used} max={l.limit} label={`${l.model} ${l.what}`} />
          <span className="mono text-xs text-ink-3">
            {(l.limit - l.used).toLocaleString("en-US")} left · <Countdown seconds={l.resets} prefix="resets in" />
          </span>
        </span>
      ) : (
        <span className="mono text-xs text-ink-3">
          {l.left} · <Countdown seconds={l.resets} prefix="resets in" />
        </span>
      )}
    </div>
  );
}

export function AllowanceScreen({ trigger }: ScreenProps) {
  return (
    <>
      <Box title="Free requests left today" sub="only daily limits you've set are counted">
        <div className="allow-big">
          <CountUp to={32866} play={trigger > 0} className="allow-n" />
          <span>free requests left today across 3 providers</span>
        </div>
        <StackedBar
          segments={[
            { label: "googleai", value: 29881, color: "var(--color-green)" },
            { label: "groq", value: 1735, color: "var(--color-blue)" },
            { label: "mistral", value: 1250, color: "var(--color-violet)" },
          ]}
        />
      </Box>

      <div className="tweak-grid">
        <Box title="googleai" sub="1 key">
          <LimitRow l={{ model: "gemini-3.8-flash", what: "Requests per day", used: 3, limit: 20, src: "Your limit", resets: 5400 }} />
          <Fold summary="3 more limits">
            <LimitRow l={{ model: "gemini-3.7-flash", what: "Requests per day", used: 4, limit: 20, src: "Your limit", resets: 5400 }} />
            <LimitRow l={{ model: "gemma-4-31b-it", what: "Requests per day", used: 2, limit: 14400, src: "Your limit", resets: 5400 }} />
            <LimitRow l={{ model: "gemini-3.1-flash-lite", what: "Requests per day", used: 16, limit: 20, src: "Your limit", resets: 5400 }} />
          </Fold>
        </Box>
        <Box title="groq" sub="2 keys">
          <LimitRow l={{ model: "openai/gpt-oss-120b", what: "Tokens", left: "7,728 left", src: "Groq says", resets: 42 }} />
          <LimitRow l={{ model: "openai/gpt-oss-120b", what: "Requests per day", used: 6, limit: 1000, src: "Your limit", resets: 5400 }} />
        </Box>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Wire them into `steps.tsx` and drop the placeholder**

Add:
```tsx
import { AllowanceScreen } from "./screens/allowance";
import { TweakScreen } from "./screens/tweak";
```
replace `placeholder("Tweak")` and `placeholder("Allowance")` with `TweakScreen` and `AllowanceScreen`, and delete the `placeholder` function. The final `STEPS` list:
```tsx
export const STEPS: StepDef[] = [
  { narration: "flexrouter, open for the first time.", page: "overview", Screen: WelcomeScreen },
  { narration: "Pick a free provider and paste a key.", page: "providers", Screen: ProvidersScreen },
  { narration: "Let AI find the models and rank them.", page: "buckets", Screen: BucketsScreen },
  { narration: "Check that every model answers.", page: "overview", Screen: TestAllScreen },
  { narration: "Send traffic. When a model runs out, the next one answers.", page: "requests", Screen: TrafficScreen },
  { narration: "Every request shows its whole journey.", page: "requests", Screen: RequestScreen },
  { narration: "When something breaks, it says why and offers the fix.", page: "status", Screen: StatusScreen },
  { narration: "Change anything by hand.", page: "settings", Screen: TweakScreen },
  { narration: "See how much free usage is left today.", page: "allowance", Screen: AllowanceScreen },
];
```

`steps.tsx` now imports screens, and the screens import `ScreenProps` from `steps.tsx`. That cycle is type-only on the screens' side (`import type`), so it is safe; keep those imports as `import type`.

- [ ] **Step 6: Append the styles to `src/styles/story.css`**

```css
@layer components {
  .tweak-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }

  .drag-board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }
  .drag-zone {
    border: 1px dashed var(--color-rule-2);
    padding: 8px;
    min-height: 92px;
    transition:
      border-color 160ms var(--ease-soft),
      background-color 160ms var(--ease-soft);
  }
  .drag-zone[data-armed] {
    border-color: var(--color-green);
    background: var(--color-green-wash);
  }
  .drag-zone-head {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 2px 2px 8px;
    background: none;
    border: 0;
    color: inherit;
    cursor: pointer;
  }
  .drag-zone-head:disabled {
    cursor: default;
  }
  .drag-hint {
    font: 500 10px var(--font-mono);
    color: var(--color-green);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    animation: pulse 1.2s ease-in-out infinite;
  }
  .drag-zone ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .drag-card {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 7px 8px;
    background: var(--color-raise);
    border: 1px solid var(--color-rule-2);
    color: var(--color-ink);
    font: 500 12px var(--font-mono);
    text-align: left;
    cursor: grab;
    touch-action: none;
  }
  .drag-card[data-picked] {
    border-color: var(--color-green);
    box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.35);
  }

  .allow-big {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-bottom: 14px;
    color: var(--color-ink-2);
    font-size: 13px;
  }
  .allow-n {
    font: 600 clamp(34px, 5vw, 48px) / 1 var(--font-mono);
    color: var(--color-green);
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 36px rgba(52, 211, 153, 0.35);
  }
  .lim-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 12px;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid var(--color-rule);
  }
  .lim-row:last-child {
    border-bottom: 0;
  }
  .lim-name {
    display: grid;
    gap: 2px;
    font-size: 12.5px;
  }
  .lim-meter,
  .lim-row > :last-child {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
}
```

- [ ] **Step 7: Run tests, lint, build, and play the whole story**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview, scroll the full story at 1280×800 and at 375×812. Step 7: the gemma card flies from smart to fast; the nvidia toggle flips on, fails, shakes, snaps back with a red toast, then flips on and stays; the number changes to 45 and Save goes Saving then Saved; Remove collapses the row and the Undo toast appears; the row comes back. Step 8: 32,866 counts up, the stacked bar grows segment by segment, and the countdowns tick. Past the last step: free play, every control works, the sidebar (or the Page select on phones) switches screens, Replay story returns to step 0. Try dragging a card with the mouse, tapping it then a bucket, and Tab/Enter then Enter.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: story screens for hand changes and allowance, plus free play"
```

---

### Task 14: Dashboard tour and "How it works"

**Files:**
- Create: `src/components/site/dashboard-tour.tsx`, `src/components/site/how-it-works.tsx`, `src/components/site/sections.test.tsx`, `public/tour/.gitkeep`
- Modify: `next.config.ts` (unoptimized images for the static export), `src/styles/site.css` (append), `src/app/page.tsx`

**Interfaces:**
- Consumes: `Box`, `Meter`, `Pill`, `Tag` (Task 4); `Fold`, `Toggle` (Task 5); `Button` (Task 3); `Reveal`, `SectionTitle` (Task 6).
- Produces: `SHOTS: { id: string; label: string; caption: string; src: string | null }[]`, `<DashboardTour />` (`id="tour"`), `EXPLAINERS: { title: string; text: string }[]`, `<HowItWorks />` (`id="how"`).

- [ ] **Step 1: Write the failing tests**

`src/components/site/sections.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardTour, SHOTS } from "./dashboard-tour";
import { EXPLAINERS, HowItWorks } from "./how-it-works";

describe("DashboardTour", () => {
  it("switches caption when a tab is picked", () => {
    render(<DashboardTour />);
    expect(screen.getByText(SHOTS[0].caption)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Allowance" }));
    expect(screen.getByRole("tab", { name: "Allowance" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(SHOTS.find((s) => s.id === "allowance")!.caption)).toBeInTheDocument();
  });
});

describe("HowItWorks", () => {
  it("has the eight explainers and the closing line", () => {
    render(<HowItWorks />);
    expect(EXPLAINERS).toHaveLength(8);
    for (const e of EXPLAINERS) expect(screen.getByRole("heading", { name: e.title })).toBeInTheDocument();
    expect(screen.getByText(/works with any app that can talk to OpenAI's API/)).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/site/sections.test.tsx`
Expected: FAIL, cannot resolve `./dashboard-tour`.

- [ ] **Step 2: Allow `next/image` in the static export**

`next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

```bash
mkdir -p public/tour && touch public/tour/.gitkeep
```

- [ ] **Step 3: Write the tour**

`src/components/site/dashboard-tour.tsx`:
```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box } from "@/components/ui/box";
import { Meter } from "@/components/ui/meter";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

/** Set `src` to "/tour/<id>.png" once the 2.3 screenshots are in public/tour/. */
export const SHOTS: { id: string; label: string; caption: string; src: string | null }[] = [
  { id: "overview", label: "Overview", caption: "What the router has been doing: requests, answers, failovers and speed, hour by hour.", src: null },
  { id: "buckets", label: "Buckets", caption: "Each bucket's models in the order it would pick them, and which ones could answer right now.", src: null },
  { id: "allowance", label: "Allowance", caption: "Every provider's free allowance, how much is used, and when it resets.", src: null },
  { id: "status", label: "Status", caption: "Everything that needs you, in plain words, with a button that fixes it.", src: null },
  { id: "playground", label: "Playground", caption: "Send a real request through the router and see which model answered, and why.", src: null },
  { id: "settings", label: "Settings", caption: "Plain names for every setting, an app password, budget caps per provider, and backup and restore.", src: null },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="tour-ph">
      <span className="label">{label}</span>
      <Meter value={14} max={20} share />
      <Meter value={8} max={20} share />
      <Meter value={17} max={20} share />
      <span className="mono text-xs text-ink-4">Screenshot added when flexrouter 2.3 ships.</span>
    </div>
  );
}

export function DashboardTour() {
  const [cur, setCur] = useState(SHOTS[0].id);
  const reduce = useReducedMotion();
  const shot = SHOTS.find((s) => s.id === cur) ?? SHOTS[0];

  return (
    <section className="wrap section" id="tour">
      <Reveal>
        <SectionTitle>The dashboard</SectionTitle>
        <p className="section-lead">The same pages as in the story, on the real thing.</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="tour-tabs" role="tablist" aria-label="Dashboard pages">
          {SHOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tour-tab-${s.id}`}
              aria-selected={s.id === cur}
              aria-controls="tour-panel"
              className="tour-tab"
              onClick={() => setCur(s.id)}
            >
              {s.id === cur && <motion.span layoutId="tour-underline" className="tour-underline" />}
              {s.label}
            </button>
          ))}
        </div>
        <Box flush className="tour-frame">
          <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${cur}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={cur}
                className="tour-fig"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {shot.src ? (
                  <Image src={shot.src} alt={`The ${shot.label} page`} width={1600} height={1000} className="tour-img" />
                ) : (
                  <Placeholder label={shot.label} />
                )}
                <figcaption>{shot.caption}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </Box>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Write "How it works" (copy is final; the owner checks it against 2.3 before merging)**

`src/components/site/how-it-works.tsx`:
```tsx
import type { ReactNode } from "react";
import { Box } from "@/components/ui/box";
import { Fold } from "@/components/ui/fold";
import { Meter } from "@/components/ui/meter";
import { Pill, type Status } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

export const EXPLAINERS: { title: string; text: string }[] = [
  {
    title: "Buckets",
    text: "Your app asks for a bucket like smart or fast, never a model name. Each bucket ranks its models by score or by speed, then picks at random among the ones within 20% of the best that can answer, so the load spreads out.",
  },
  {
    title: "Failover",
    text: "When a model is rate-limited, down or broken, the next one answers straight away, with no waiting between tries. A request pinned to one model reports the failure instead of switching, so you always know which model answered.",
  },
  {
    title: "Several keys per provider",
    text: "Add more than one key for a provider and they are used in turn. A key that hits its limit is skipped until it resets. Keys live in their own file, never in your settings file.",
  },
  {
    title: "Statuses and the error brain",
    text: "Every model and key has one status: Ready, Busy, Struggling, Needs you or Off. Errors are explained in plain words. The error brain sorts each new error, says how sure it is, and asks you to check when it isn't.",
  },
  {
    title: "Allowance",
    text: "See what is left of every free allowance today and when each limit resets. Limits you set are marked as yours. Numbers the provider reports carry the provider's name.",
  },
  {
    title: "Setup with AI",
    text: "Pick a provider from the list, marked free or paid, and paste a key. Add models with AI finds the models the key can use, Get rate limits with AI fills in their limits, and Rank with AI puts them in order.",
  },
  {
    title: "Every request on record",
    text: "Each request gets an ID and a record of every model it tried, how each one failed, and which one answered. The Playground sends a real request through the router so you can watch it happen.",
  },
  {
    title: "Safe with your settings and money",
    text: "flexrouter never rewrites your settings file. Changes made in the dashboard go in a separate file that you can reset. A budget cap can hold any paid provider at $0, so a fallback never bills you.",
  },
];

const ALL: Status[] = ["ready", "busy", "struggling", "needs", "off"];

const VISUALS: ReactNode[] = [
  <div key="b" className="hiw-vis">
    {[95, 85, 78].map((v, i) => (
      <div key={v} className="hiw-line">
        <span className="mono">{["gemini-3.8-flash", "gpt-oss-120b", "mistral-medium"][i]}</span>
        <Meter value={v} max={95} cells={10} share />
      </div>
    ))}
  </div>,
  <div key="f" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>groq</span>
      <Pill status="busy" />
    </div>
    <div className="hiw-line">
      <span>
        groq → googleai <span className="text-blue">↻</span>
      </span>
      <Pill status="ready" />
    </div>
  </div>,
  <div key="k" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>groq · key 1</span>
      <Pill status="busy" />
    </div>
    <div className="hiw-line">
      <span>groq · key 2</span>
      <Pill status="ready" />
    </div>
  </div>,
  <div key="s" className="hiw-vis hiw-pills">
    {ALL.map((s) => (
      <Pill key={s} status={s} />
    ))}
  </div>,
  <div key="a" className="hiw-vis mono text-xs">
    <div className="hiw-line">
      <span>gemini-3.8-flash</span>
      <Tag tone="limit">Your limit</Tag>
    </div>
    <Meter value={3} max={20} />
    <div className="hiw-line">
      <span>7,728 tokens left</span>
      <Tag tone="provider">Groq says</Tag>
    </div>
  </div>,
  <div key="ai" className="hiw-vis hiw-pills">
    <Tag tone="free">Free tier</Tag>
    <Tag tone="free">Free tier</Tag>
    <Tag tone="paid">Paid</Tag>
  </div>,
  <div key="r" className="hiw-vis">
    <Fold summary="Tried first" note="1 attempt">
      <span className="mono text-xs text-ink-2">groq/openai/gpt-oss-120b · 429 · moved on at once</span>
    </Fold>
  </div>,
  <div key="m" className="hiw-vis mono text-xs">
    <code className="text-ink-2">provider_budget: {"{ openai: 0 }"}</code>
  </div>,
];

export function HowItWorks() {
  return (
    <section className="wrap section" id="how">
      <Reveal>
        <SectionTitle>How it works</SectionTitle>
      </Reveal>
      <div className="hiw-grid">
        {EXPLAINERS.map((e, i) => (
          <Reveal key={e.title} delay={(i % 4) * 0.06}>
            <Box lift className="hiw-card">
              <span className="hiw-num mono">0{i + 1}</span>
              <h3 className="hiw-title">{e.title}</h3>
              <p>{e.text}</p>
              {VISUALS[i]}
            </Box>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <p className="hiw-close">
          It works with any app that can talk to OpenAI&apos;s API. Point it at{" "}
          <code>http://localhost:4891/v1</code> and use a bucket name as the model. There is a Python client too.
        </p>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 5: Append the styles to `src/styles/site.css`**

```css
@layer components {
  .section-lead {
    margin: 12px 0 0;
    color: var(--color-ink-2);
    max-width: 60ch;
  }
  .tour-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 28px 0 12px;
  }
  .tour-tab {
    position: relative;
    padding: 8px 12px;
    background: none;
    border: 0;
    color: var(--color-ink-3);
    font: 500 12px var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
  }
  .tour-tab[aria-selected="true"] {
    color: var(--color-ink);
  }
  .tour-underline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: var(--color-green);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.8);
  }
  .tour-fig {
    margin: 0;
  }
  .tour-img {
    display: block;
    width: 100%;
    height: auto;
  }
  .tour-fig figcaption {
    padding: 12px 14px;
    border-top: 1px solid var(--color-rule);
    color: var(--color-ink-2);
    font-size: 14px;
  }
  .tour-ph {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 12px;
    aspect-ratio: 16 / 10;
    background:
      linear-gradient(180deg, transparent, rgba(52, 211, 153, 0.04)),
      repeating-linear-gradient(0deg, transparent 0 23px, var(--color-rule) 23px 24px);
  }

  .hiw-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
    margin-top: 32px;
  }
  .hiw-card {
    height: 100%;
  }
  .hiw-card .box-body {
    display: grid;
    gap: 10px;
    align-content: start;
    height: 100%;
  }
  .hiw-num {
    font-size: 11px;
    color: var(--color-green);
  }
  .hiw-title {
    margin: 0;
    font: 600 16px var(--font-mono);
  }
  .hiw-card p {
    margin: 0;
    color: var(--color-ink-2);
    font-size: 14px;
  }
  .hiw-vis {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--color-rule);
    display: grid;
    gap: 8px;
  }
  .hiw-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 12px;
  }
  .hiw-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
  }
  .hiw-close {
    margin: 28px 0 0;
    color: var(--color-ink-2);
    font-size: 15px;
  }
}
```

- [ ] **Step 6: Put both on the page**

In `src/app/page.tsx`, render `<DashboardTour />` then `<HowItWorks />` after `<Story />`.

- [ ] **Step 7: Run tests, lint, build, commit**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

```bash
git add -A
git commit -m "feat: dashboard tour placeholders and the How it works section"
```

---

### Task 15: Get started, Built with flexrouter, final page

**Files:**
- Create: `src/components/site/get-started.tsx`, `src/components/site/built-with.tsx`, `src/components/site/closing.test.tsx`
- Modify: `src/styles/site.css` (append), `src/app/page.tsx` (final)

**Interfaces:**
- Consumes: `Box`, `Meter`, `Tag` (Task 4); `Button`, `ButtonLink`, `copyText` (Task 3); `Reveal`, `SectionTitle`, `GITHUB`, `STASH`, `AGORA` (Task 6).
- Produces: `<GetStarted />` (`id="start"`, includes the closing call to action), `<BuiltWith />` (`id="built"`).

- [ ] **Step 1: Write the failing tests**

`src/components/site/closing.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuiltWith } from "./built-with";
import { GetStarted } from "./get-started";

describe("GetStarted", () => {
  it("lists five steps and links to the quickstart", () => {
    const { container } = render(<GetStarted />);
    expect(container.querySelectorAll(".start-step")).toHaveLength(5);
    expect(screen.getAllByRole("link", { name: /Quickstart/ })[0]).toHaveAttribute("href", "/quickstart");
  });
});

describe("BuiltWith", () => {
  it("marks both projects as being updated", () => {
    render(<BuiltWith />);
    expect(screen.getAllByText("Being updated")).toHaveLength(2);
    expect(screen.getAllByText("Runs on an older flexrouter for now.")).toHaveLength(2);
  });
});
```

Run: `npm test -- src/components/site/closing.test.tsx`
Expected: FAIL, cannot resolve `./built-with`.

- [ ] **Step 2: Write Get started (with the closing call to action)**

`src/components/site/get-started.tsx`:
```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { Box } from "@/components/ui/box";
import { Button, ButtonLink } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { copyText } from "@/lib/copy";
import { GITHUB } from "@/lib/links";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

const INSTALL = "pip install git+https://github.com/notnotnotnoone/flexrouter";

const STEPS: { title: string; body: ReactNode }[] = [
  { title: "Install", body: <code>{INSTALL}</code> },
  {
    title: "Open the dashboard",
    body: (
      <>
        <code>flexrouter dashboard</code> starts it and opens your browser.
      </>
    ),
  },
  { title: "Add a free provider", body: "Pick one from the list and paste its key." },
  { title: "Add models, then test", body: "Press Add models with AI, then Test all." },
  {
    title: "Point your app at it",
    body: (
      <>
        Use <code>http://localhost:4891/v1</code> and a bucket name as the model.
      </>
    ),
  },
];

export function GetStarted() {
  const reduce = useReducedMotion();
  const cta = useRef<HTMLDivElement>(null);
  const ctaSeen = useInView(cta, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <section className="wrap section" id="start">
      <Reveal>
        <SectionTitle>Get started</SectionTitle>
        <p className="section-lead">About ten minutes. Everything after the install happens in the dashboard.</p>
      </Reveal>

      <ol className="start-list">
        <motion.span
          className="start-line"
          aria-hidden
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "0px 0px -20% 0px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {STEPS.map((s, i) => (
          <li key={s.title} className="start-step">
            <Reveal delay={i * 0.08}>
              <span className="start-num mono">{i + 1}</span>
              <div>
                <h3 className="start-title">{s.title}</h3>
                <p className="start-body">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          kind="copy"
          icon={Copy}
          label="Copy install command"
          doneLabel="Copied"
          run={async (source) => {
            if (source === "user") await copyText(INSTALL);
          }}
        />
        <ButtonLink kind="primary" href="/quickstart" icon={ArrowRight} label="Full quickstart" />
      </div>

      <div ref={cta} className="mt-24">
        <Box className="cta-band">
          <Meter value={ctaSeen ? 20 : 0} max={20} share label="Free usage available" />
          <h2 className="cta-title">Run your AI apps on free tiers.</h2>
          <div className="cta-row">
            <ButtonLink kind="primary" size="lg" href="/quickstart" icon={ArrowRight} label="Quickstart" />
            <ButtonLink kind="ghost" size="lg" href={GITHUB} external icon={ArrowUpRight} label="View on GitHub" />
          </div>
        </Box>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write Built with flexrouter**

`src/components/site/built-with.tsx`:
```tsx
import { ArrowUpRight } from "lucide-react";
import { Box } from "@/components/ui/box";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AGORA, STASH } from "@/lib/links";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

const PROJECTS = [
  {
    name: "stash",
    href: STASH,
    text: "An AI inventory for storage boxes. Photograph your boxes, ask what is in them, and browse them on a 3D map.",
  },
  {
    name: "agora",
    href: AGORA,
    text: "Two AI models argue opposite sides of a dilemma in real time while you watch.",
  },
];

export function BuiltWith() {
  return (
    <section className="wrap section" id="built">
      <Reveal>
        <SectionTitle>Built with flexrouter</SectionTitle>
      </Reveal>
      <div className="built-grid">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <Box lift className="built-card">
              <div className="flex items-center justify-between gap-3">
                <span className="built-name mono">{p.name}</span>
                <Tag>Being updated</Tag>
              </div>
              <p>{p.text}</p>
              <p className="text-ink-4">Runs on an older flexrouter for now.</p>
              <ButtonLink kind="ghost" size="sm" href={p.href} external icon={ArrowUpRight} label="GitHub" />
            </Box>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Append the styles to `src/styles/site.css`**

```css
@layer components {
  .start-list {
    position: relative;
    list-style: none;
    margin: 32px 0 0;
    padding: 0 0 0 4px;
    display: grid;
    gap: 22px;
  }
  .start-line {
    position: absolute;
    left: 17px;
    top: 14px;
    bottom: 14px;
    width: 1px;
    background: linear-gradient(var(--color-green), var(--color-blue), var(--color-violet));
    transform-origin: top;
  }
  .start-step > .reveal {
    display: flex;
    gap: 18px;
    align-items: flex-start;
  }
  .start-num {
    position: relative;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: none;
    background: var(--color-ground);
    border: 1px solid var(--color-green);
    color: var(--color-green);
    font-size: 12px;
    box-shadow: 0 0 16px -4px rgba(52, 211, 153, 0.6);
  }
  .start-title {
    margin: 2px 0 4px;
    font: 600 15px var(--font-mono);
  }
  .start-body {
    margin: 0;
    color: var(--color-ink-2);
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .start-body code {
    color: var(--color-ink);
    font-size: 13px;
  }

  .cta-band {
    overflow: hidden;
    background:
      radial-gradient(600px 240px at 50% 120%, rgba(52, 211, 153, 0.16), transparent 70%),
      var(--color-panel);
  }
  .cta-band .box-body {
    display: grid;
    justify-items: center;
    gap: 22px;
    padding: clamp(40px, 7vw, 80px) 16px;
    text-align: center;
  }
  .cta-title {
    margin: 0;
    font: 600 clamp(26px, 5vw, 48px) / 1.1 var(--font-mono);
    letter-spacing: -0.03em;
  }
  .cta-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .built-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
    margin-top: 32px;
  }
  .built-card .box-body {
    display: grid;
    gap: 10px;
  }
  .built-card p {
    margin: 0;
    color: var(--color-ink-2);
    font-size: 14px;
  }
  .built-name {
    font-size: 17px;
    font-weight: 600;
  }
}
```

- [ ] **Step 5: Final `src/app/page.tsx`**

```tsx
import { BuiltWith } from "@/components/site/built-with";
import { DashboardTour } from "@/components/site/dashboard-tour";
import { Footer } from "@/components/site/footer";
import { GetStarted } from "@/components/site/get-started";
import { HowItWorks } from "@/components/site/how-it-works";
import { Nav } from "@/components/site/nav";
import { PlainWords } from "@/components/site/plain-words";
import { Spotlight } from "@/components/site/spotlight";
import { Story } from "@/components/story/Story";
import { Hero } from "@/components/ui/animated-hero";

export default function Home() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main">
        <Hero />
        <PlainWords />
        <Story />
        <DashboardTour />
        <HowItWorks />
        <GetStarted />
        <BuiltWith />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Run tests, lint, build, look, commit**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

In the preview, scroll the whole page top to bottom at 1280px and 375px: every section title types in, sections rise in, the Get started line draws down through the numbered steps, the closing meter fills cell by cell when it comes into view, "Other projects" in the nav lands on Built with flexrouter.

```bash
git add -A
git commit -m "feat: Get started, closing call to action and Built with flexrouter"
```

---

### Task 16: The `/quickstart` page (dashboard first)

**Files:**
- Create: `src/components/ui/code-block.tsx`, `src/components/ui/code-block.test.tsx`
- Replace: `src/app/quickstart/page.tsx`
- Modify: `src/styles/site.css` (append)

**Interfaces:**
- Consumes: `Button`, `copyText` (Task 3); `Box` (Task 4); `Fold` (Task 5); `Nav`, `Footer`, `Spotlight`, `Reveal`, `GITHUB` (Task 6).
- Produces: `<CodeBlock code label? />`.

- [ ] **Step 1: Write the failing test**

`src/components/ui/code-block.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("shows the code, its label and a copy button", () => {
    render(<CodeBlock label="terminal" code="flexrouter dashboard" />);
    expect(screen.getByText("flexrouter dashboard")).toBeInTheDocument();
    expect(screen.getByText("terminal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
```

Run: `npm test -- src/components/ui/code-block.test.tsx`
Expected: FAIL, cannot resolve `./code-block`.

- [ ] **Step 2: Write `code-block.tsx`**

```tsx
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
```

- [ ] **Step 3: Replace `src/app/quickstart/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { Spotlight } from "@/components/site/spotlight";
import { Box } from "@/components/ui/box";
import { CodeBlock } from "@/components/ui/code-block";
import { Fold } from "@/components/ui/fold";
import { GITHUB } from "@/lib/links";

export const metadata: Metadata = {
  title: "flexrouter quickstart",
  description: "Install flexrouter, open the dashboard, add a free provider and point your app at it.",
};

const INSTALL = "pip install git+https://github.com/notnotnotnoone/flexrouter";

const CURL = `curl http://localhost:4891/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "smart", "messages": [{"role": "user", "content": "hi"}]}'`;

const OPENAI_SDK = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4891/v1",
    api_key="your app password from Settings",
)
reply = client.chat.completions.create(
    model="smart",  # a bucket name, not a model
    messages=[{"role": "user", "content": "hi"}],
)
print(reply.choices[0].message.content)`;

const YAML = `providers:
  groq:
    base_url: https://api.groq.com/openai/v1

buckets:
  smart:
    - provider: groq
      model: openai/gpt-oss-120b
      score: 85
      rpm: 30
      tpm: 8000
      context_window: 131072`;

const CLIENT = `from flexrouter import FlexRouter

router = FlexRouter()
reply = router.generate(
    messages=[{"role": "user", "content": "Summarise this in one line."}],
    tier="smart",
)
print(reply["choices"][0]["message"]["content"])`;

const STEPS = [
  {
    title: "Install",
    body: <p>Needs Python 3.11 or newer.</p>,
    code: <CodeBlock label="terminal" code={INSTALL} />,
  },
  {
    title: "Open the dashboard",
    body: <p>This starts flexrouter in the background and opens the dashboard in your browser. Leave it running.</p>,
    code: <CodeBlock label="terminal" code="flexrouter dashboard" />,
  },
  {
    title: "Add a free provider",
    body: (
      <p>
        On the Get started card, pick a provider marked free tier, follow its Get a key link, and paste the key. The step
        ticks itself when the key works. Add a second provider the same way: more providers means more free usage.
      </p>
    ),
  },
  {
    title: "Add models, then Test all",
    body: (
      <p>
        Press Add models with AI to find the models your keys can use and put them in buckets. Then press Test all: it
        says hi to every model once and shows which ones answer.
      </p>
    ),
  },
  {
    title: "Point your app at it",
    body: (
      <p>
        Anything that can talk to OpenAI&apos;s API works. Use <code>http://localhost:4891/v1</code> as the address and a
        bucket name, like <code>smart</code>, wherever it asks for a model.
      </p>
    ),
    code: (
      <div className="grid gap-3">
        <CodeBlock label="curl" code={CURL} />
        <CodeBlock label="python, OpenAI SDK" code={OPENAI_SDK} />
      </div>
    ),
  },
];

export default function Quickstart() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main wrap section">
        <Reveal>
          <h1 className="qs-title">
            <span className="slashes">//</span>Quickstart
          </h1>
          <p className="section-lead">About ten minutes. Everything after the install happens in the dashboard.</p>
        </Reveal>

        <ol className="qs-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.05}>
                <Box lift title={`${i + 1} · ${s.title}`}>
                  <div className="qs-body">
                    {s.body}
                    {s.code}
                  </div>
                </Box>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal>
          <div className="qs-more">
            <Fold summary="Prefer editing the settings file by hand?">
              <p>
                Run <code>flexrouter doctor</code> to see where your settings file is. flexrouter reads it but never
                rewrites it, and your keys never go in it (save them with <code>flexrouter keys add groq</code>).
              </p>
              <CodeBlock label="config.yaml" code={YAML} />
            </Fold>
            <Fold summary="Calling it from Python without the web address">
              <p>For Python code that would rather call flexrouter directly. It uses the same settings.</p>
              <CodeBlock label="python" code={CLIENT} />
            </Fold>
            <p className="text-ink-3">
              The full guides are in the{" "}
              <a className="text-green underline-offset-4 hover:underline" href={`${GITHUB}/tree/master/docs`}>
                flexrouter repository
              </a>
              .
            </p>
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Append the styles to `src/styles/site.css`**

```css
@layer components {
  .qs-title {
    margin: 0;
    font: 600 clamp(32px, 6vw, 56px) / 1.05 var(--font-mono);
    letter-spacing: -0.03em;
  }
  .qs-steps {
    list-style: none;
    margin: 40px 0 0;
    padding: 0;
    display: grid;
    gap: 16px;
  }
  .qs-body {
    display: grid;
    gap: 12px;
  }
  .qs-body p,
  .qs-more p {
    margin: 0;
    color: var(--color-ink-2);
    font-size: 15px;
  }
  .qs-body code,
  .qs-more code {
    color: var(--color-ink);
  }
  .qs-more {
    margin-top: 40px;
    display: grid;
    gap: 16px;
  }
  .qs-more .fold-body {
    display: grid;
    gap: 12px;
  }

  .code-block {
    border: 1px solid var(--color-rule);
    background: #030303;
  }
  .code-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 4px 4px 12px;
    border-bottom: 1px solid var(--color-rule);
  }
  .code-block pre {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--color-ink-2);
  }
}
```

- [ ] **Step 5: Run tests, lint, build, look, commit**

Run: `npm test && npm run lint && npm run build`
Expected: all pass, `out/quickstart.html` (or `out/quickstart/index.html`) exists.

In the preview at `/quickstart`, 1280px and 375px: five step boxes rise in, code blocks scroll sideways inside themselves (never the page), Copy ticks, both folds open.

```bash
git add -A
git commit -m "feat: dashboard-first quickstart page"
```

---

### Task 17: Browser smoke test (desktop, phone, reduced motion) and polish fixes

**Files:**
- Create: `scripts/smoke.mjs`
- Modify: `package.json` (`smoke` script, `playwright` dev dependency), `.gitignore` (`smoke-shots/`), plus whichever component the checks show is wrong

**Interfaces:**
- Consumes: the whole site.
- Produces: `npm run smoke` (needs the dev server on port 3000): walks `/` and `/quickstart` at 1280×800, at 375×812 (touch), and at 1280×800 with reduced motion; fails on any console or page error or any sideways overflow; prints the narration line at each story step; saves a screenshot per step to `smoke-shots/`.

- [ ] **Step 1: Install Playwright and Chromium**

```bash
npm i -D playwright
npx playwright install chromium
```

Add `smoke-shots/` to `.gitignore`, and `"smoke": "node scripts/smoke.mjs"` to `package.json` scripts.

- [ ] **Step 2: Write `scripts/smoke.mjs`**

```js
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.SHOTS_DIR ?? "smoke-shots";
const STEPS = 9;

const runs = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" },
  { name: "phone", viewport: { width: 375, height: 812 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
  { name: "reduced", viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" },
];

mkdirSync(OUT, { recursive: true });
let failed = false;
const browser = await chromium.launch();

for (const r of runs) {
  const ctx = await browser.newContext({
    viewport: r.viewport,
    reducedMotion: r.reducedMotion,
    isMobile: r.isMobile ?? false,
    hasTouch: r.hasTouch ?? false,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  for (const path of ["/", "/quickstart"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) {
      failed = true;
      console.error(`[${r.name}] ${path}: page is ${overflow}px wider than the viewport`);
    }
  }

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const top = await page.evaluate(() => document.getElementById("story").getBoundingClientRect().top + window.scrollY);
  const vh = r.viewport.height;
  for (let s = 0; s <= STEPS; s++) {
    await page.evaluate((y) => window.scrollTo(0, y), top + s * vh + vh * 0.3);
    await page.waitForTimeout(s === STEPS ? 800 : 7500);
    const line = (await page.locator(".story-line").innerText()).replace(/\s+/g, " ");
    console.log(`[${r.name}] step ${s}: ${line}`);
    await page.screenshot({ path: `${OUT}/${r.name}-step-${s}.png` });
  }

  if (errors.length) {
    failed = true;
    console.error(`[${r.name}] errors:\n  ${errors.join("\n  ")}`);
  }
  await ctx.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
```

(The 7.5 s wait lets each step's longest choreography, Tweak at 6.9 s, finish before the screenshot.)

- [ ] **Step 3: Run it**

Start the `showcase` preview (dev server on port 3000), then:

Run: `npm run smoke`
Expected: exit code 0; for each of `desktop`, `phone`, `reduced`, ten lines `step 0` to `step 9` whose text matches the nine narration lines in order and then `Everything here is live. Press anything. Replay story`; no overflow or error lines.

If it fails: read the message, fix the component it names (typical culprits: a `.row` that doesn't wrap at 375px, a `white-space: nowrap` code line outside a scroll container, a hydration warning from a value that differs between server and client), rerun until it passes.

- [ ] **Step 4: Look at every screenshot**

Open `smoke-shots/*.png` (or `SendUserFile` them to the owner). For each, check against spec §6: the right page is marked in the sidebar, the step's end state is visible (for example `desktop-step-6.png` shows "Nothing needs you."), nothing is clipped by the window's fixed height (if a screen is taller than the window, `.md-screen` scrolls; that is acceptable, but the key moment must be in view without scrolling; tighten spacing or move the key element up if not). In the `reduced` set: the window is flat from the start and screens change without movement.

- [ ] **Step 5: Flash audit (in the browser pane, full motion, 1280px)**

Go down this list and fix anything that doesn't happen or looks cheap:
- Logo lanes draw in; node breathes.
- Nav progress line grows with scroll.
- Spotlight lights the dots under the cursor, and nowhere else.
- Hero: staggered blur-rise entrance; the green word springs; packets flow into the node and out.
- Every section title types in with a green block caret.
- Boxes marked `lift` rise 2px and grow their corner ticks on hover.
- Primary buttons glow on hover.
- Story: tilt-in with the green top edge fading in; narration blur-slides; sidebar marker slides; rail dash glows; every one of the four good-news moments plays (Get started sweep, Test all wave, fix flight to the Ready chip, "Nothing needs you." glow).
- Tour underline slides between tabs.
- Get started line draws down; closing meter fills.

- [ ] **Step 6: Run everything and commit**

Run: `npm test && npm run lint && npm run build && npm run smoke`
Expected: all pass.

```bash
git add -A
git commit -m "test: browser smoke test for desktop, phone and reduced motion, with polish fixes"
```

---

### Task 18: README, and hand back

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite `README.md`**

```markdown
# showcase

Source for [notnotnotnoone.github.io](https://notnotnotnoone.github.io): the site for [flexrouter](https://github.com/notnotnotnoone/flexrouter).

Next.js (static export), Tailwind CSS 4, framer-motion. The look copies the flexrouter dashboard; the scroll story on the home page plays every dashboard button and widget with fake data.

## Dev

    npm install
    npm run dev

## Checks

    npm test            # unit and component tests (Vitest)
    npm run lint
    npm run build       # runs the no-dash check first, then the static export to out/
    npm run smoke       # browser walk-through; needs `npm run dev` running and `npx playwright install chromium` once

Copy rule: no em dashes or en dashes anywhere under `src/`. The build fails if one gets in.

## Deploy

Pushing to `master` deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

The `v2-redesign` branch describes flexrouter 2.3 and must not be merged before 2.3 is released. Before merging:

- add the dashboard screenshots to `public/tour/` and set each `src` in `src/components/site/dashboard-tour.tsx`
- check the "How it works" text and the quickstart against 2.3 as shipped
- switch the install command to PyPI if 2.3 is published there
- link the quickstart to the rewritten Getting Started guide
```

(Indented code blocks are used here only because this plan is itself Markdown; in the real README use fenced `bash` blocks.)

- [ ] **Step 2: Final full check**

Run: `npm test && npm run lint && npm run build && npm run smoke`
Expected: all pass.

Run: `git status`
Expected: clean except `.claude/launch.json`, which is the owner's call and stays uncommitted.

- [ ] **Step 3: Commit, and do not merge**

```bash
git add README.md
git commit -m "docs: README for the V2 site and the pre-merge checklist"
```

Do not push to or merge into `master`. Report to the owner: the branch name, the test/lint/build/smoke results, the screenshot folder, and the four pre-merge items from the README.
