# Showcase V2 redesign: design

Date: 2026-09-26 · Branch: `v2-redesign` · Status: agreed in a brainstorm/grill session with the owner (Q1 to Q21)

The showcase (notnotnotnoone.github.io) is rebuilt to look like the flexrouter V2 dashboard, to describe flexrouter **2.3**, and to explain the app far better, including to people who don't code. A throwaway prototype of the layout is at `.scratch/demo.html` (gitignored).

## 1. Decisions

| # | Decision |
|---|---|
| D1 | **Look:** the flexrouter V2 dashboard system (router repo `docs/superpowers/specs/2026-09-22-dashboard-redesign-design.md` §2 plus `.scratch/polish/showcase/port.css`). |
| D2 | **Dark only.** No light theme, no toggle. |
| D3 | **Home page is flexrouter first**, with a plain-words block for non-coders right under the hero. |
| D4 | **Claims:** one bold hero line; every other sentence is precise. No "infinite", no "never runs out". |
| D5 | **Content targets flexrouter 2.3** (router repo `PLAN-V2.3.md`), not the outdated `docs/1-5`. |
| D6 | **Branch only.** `v2-redesign` merges to `master` (which auto-deploys) only when 2.3 is released. No public preview. |
| D7 | **Other projects:** one small "Built with flexrouter" strip. stash and agora are marked "being updated" because they run on the broken V1. funaithings is dropped. |
| D8 | **Centrepiece:** a scroll story inside the container-scroll component (Apple product page style), followed by a screenshot tour. |
| D9 | **The story shows every button kind and widget** from the router's `.scratch/polish/showcase/`. |
| D10 | **Scroll plays each step; the current step's button is also live.** Clicking never moves the story. The page ends in free play with a Replay story button. |
| D11 | **Widgets are rebuilt as React components** in this repo, copying tokens, shapes and motion from `app.css` + `port.css`. No runtime or build dependency on the router repo. |
| D12 | **The two pasted components** (animated hero, container scroll) are used for their motion but restyled to V2. |
| D13 | **More detail about the app** goes in a "How it works" section (eight explainers), not a docs system. |
| D14 | **Phones get the same story** with a simplified window. |
| D15 | **Reduced motion** follows the gallery's rules. No motion toggle on the site. |
| D16 | **Copy rules:** no em dashes (or en dashes used as dashes), nothing that sounds AI-written, no jokey labels. |

## 2. Visual system

The tokens are copied from the dashboard and defined once, in `globals.css` under Tailwind v4's `@theme`:

| Token | Hex | Use |
|---|---|---|
| `ground` | `#000000` | page |
| `panel` | `#070707` | boxes |
| `raise` | `#0e0e0e` | inputs, sheets, toasts |
| `rule` / `rule-2` | `#1f1f1f` / `#2e2e2e` | borders |
| `cell-off` | `#141414` | empty meter cells |
| `ink` `ink-2` `ink-3` `ink-4` | `#f5f5f5` `#a3a3a3` `#6b7280` `#525252` | text |
| `green` | `#34d399` | brand, primary, Ready, focus |
| `blue` | `#7dd3fc` | failover, fix buttons, Busy |
| `violet` | `#a78bfa` | AI actions, test buttons |
| `warn` | `#fbbf24` | meters at 80% or more |
| `hot` | `#fb923c` | Struggling (from `port.css`) |
| `bad` | `#f87171` | Needs you, danger, failed |

- **Fonts:** Geist and Geist Mono through `next/font`. Mono is used for headings, figures, labels and buttons; sans for sentences.
- **Shapes:** square corners (buttons 2px at most), a 1px `rule` border, 6px green corner ticks on boxes, and a 24px dot grid behind the page.
- **Statuses:** always a glyph plus a word: ● Ready, ◐ Busy, ◆ Struggling, ▲ Needs you, ○ Off.
- **Logo:** the dashboard's mark plus its wordmark: Geist 700, a blue → violet → green gradient (`app.css` `.wordmark`). If 2.3 changes it, match 2.3.
- **No emojis.** Icons are `lucide-react`, the same set the dashboard uses.

## 3. Stack changes

- **Tailwind v4** becomes active: `@import "tailwindcss"` in `globals.css`, plus the `@theme` tokens above. The hand-written CSS classes are replaced as each section is rebuilt.
- **shadcn structure, set up by hand** (the CLI would overwrite `globals.css` with light/dark tokens and rounded defaults):
  - `components.json` (paths: `@/components`, `@/components/ui`, `@/lib/utils`)
  - `src/lib/utils.ts` with `cn()` (`clsx` + `tailwind-merge`)
  - `src/components/ui/` for primitives: `button.tsx`, `animated-hero.tsx`, `container-scroll-animation.tsx`
- **Add:** `framer-motion`, `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Remove:** `gsap`, `lenis`, and `src/app/Motion.tsx`. One animation library.
- The static export (`output: "export"`) and `.github/workflows/deploy.yml` are unchanged.

## 4. Components

| File | Job |
|---|---|
| `ui/button.tsx` | cva variants = the gallery's kinds: `primary`, `fix`, `test`, `copy`, `danger`, `ghost`. States: idle, hover, pressed (scale .97), working (spinner + working word), done (tick + done word), failed (shake + reason), disabled. Takes `working` / `done` labels and an async `run()`. |
| `ui/animated-hero.tsx` | The pasted hero, restyled: left or centred Geist Mono headline, rotating word in green with the spring, V2 buttons. |
| `ui/container-scroll-animation.tsx` | The pasted component, restyled: square box, 1px rule, corner ticks, no bezel or heavy shadow. Tilt 20° to 0° and scale on the way in. |
| `story/pill.tsx` | Status pill, optional countdown ("back in 42s"). |
| `story/meter.tsx` | 20-cell block meter; green, then warn at 80% or more, bad at 100%. `wave()` for Test all. |
| `story/stacked-bar.tsx` | Allowance's per-provider stacked bar. |
| `story/toggle.tsx` | Switch; flips at once, and on a failed save snaps back, shakes and toasts. |
| `story/fold.tsx` | Expand/collapse (Thinking, Tried first). |
| `story/toast.tsx` | Toasts, at most three, hover holds them, optional action (Undo). |
| `story/sheet.tsx` | Request sheet sliding in from the right. |
| `story/status-list.tsx` | Status rows plus the summary chips; the "fix → ● → square flies to Ready chip" moment. |
| `story/get-started.tsx` | The 5-step card; green sweep when complete. |
| `story/drag.tsx` | Model card to bucket by drag, tap then tap, or Enter then Enter. |
| `story/mini-dash.tsx` | The window: sidebar (desktop) or page switcher line (phone), plus a screen that renders one story step. |
| `story/steps.ts` | The script: for each step its narration, page, screen state, and which actions scroll plays. |
| `story/Story.tsx` | Pins the window, maps scroll progress to a step, plays the step's actions, and handles free play and Replay. |

Every story component is driven by props from `steps.ts`, so scrolling back renders an earlier step's state exactly (the step is a pure function of the step index). The actions scroll plays are fire-and-forget animations on top of that state.

## 5. Home page, in order

1. **Nav:** logo; Quickstart, Other projects (anchor), GitHub.
2. **Hero:** "Your app keeps answering when **groq** runs out." The rotating word cycles through groq, google, mistral, cerebras and openrouter. Under it: "flexrouter pools the free tiers of several AI providers behind one local address. When one model hits its limit, the next best one answers. You pay nothing unless you allow it." Buttons: Quickstart (primary), View on GitHub (ghost).
3. **What is flexrouter?** (the approved text, verbatim):
   > **Short answer:** a tool that lets apps run on free AI without hitting the limits.
   >
   > Google, Groq, Mistral and a few other AI companies give developers free access to their models, but the limits are tight. Some of Google's newest models allow 20 requests a day. Groq's free tier stops at around 30 a minute. That sounds like plenty until you realise a modern AI app, like a coding assistant or anything that uses tools, can fire off a dozen requests for a single thing you ask it. On one free account, it stalls within minutes.
   >
   > flexrouter pools them. It runs in the background on your computer, and every app sends its AI requests to it instead of to one company. It tracks how much free usage is left everywhere and sends each request to the best model that still has room. When one hits its limit, the next one takes over, so the app keeps working and the bill stays at zero.
   >
   > A dashboard shows where every request went, what's left for the day, and what broke and why.

   Followed by a small note: "Limits as of September 2026."
4. **The story** (§6).
5. **The dashboard:** a tabbed screenshot tour (Overview, Buckets, Allowance, Status, Playground, Settings), one caption each. The Playground, budget caps, settings backup and the app password are covered here. Placeholders until 2.3 ships (§10).
6. **How it works** (§7).
7. **Get started:** the 5 steps in short, with a Copy button on the install command, and a link to `/quickstart`.
8. **Built with flexrouter:** stash and agora cards, each with a "being updated" tag, one sentence, "Runs on an older flexrouter for now.", and a GitHub link.
9. **Footer.**

## 6. The story

The window tilts in, then pins. Each step takes one viewport of scroll, and scrolling back reverses. The narration is one plain line above the window, with a `n/8` counter and progress dashes under the window.

| # | Narration | Plays | Covers |
|---|---|---|---|
| 0 | flexrouter, open for the first time. | Get started · 0 of 5 | container scroll, Get started card |
| 1 | Pick a free provider and paste a key. | preset grid (FREE TIER / PAID), Groq picked, **Test key** runs then ● Ready, a second key added: "2 keys, used in turn" | presets, `test`, pill, multiple keys |
| 2 | Let AI find the models and rank them. | **Add models with AI** fills `smart`; **Rank with AI** reorders it with movement arrows; Smartest / Fastest switch | `primary`, buckets, ranking |
| 3 | Check that every model answers. | **Test all**: meter wave, then "All 6 work"; **Copy curl**; Get started completes with the green sweep | `test`, `copy`, good-news moments 1 and 2 |
| 4 | Send traffic. When a model runs out, the next one answers. | requests stream, meters fill; a groq model caps: ● Ready → ◐ Busy "back in 42s", key 1 → key 2, then google answers; log row `groq → google ↻` | failover, key rotation, meters, countdown |
| 5 | Every request shows its whole journey. | a row opens the request sheet; **Tried first ▸** and **Thinking ▸** unfold; Copy request ID | sheet, fold |
| 6 | When something breaks, it says why and offers the fix. | Mistral 403 → error brain says "Not on your plan" with a confidence meter → ▲ Needs you row → **Use mistral-small instead** → ▲ spins into ●, square flies to the Ready chip → "Nothing needs you." A ◆ Struggling row with **Retry** sits alongside. | status list, error brain, `fix`, good-news moments 3 and 4 |
| 7 | Change anything by hand. | **drag** a model into `fast`; **toggle** a provider off (fails once, shakes, snaps back, then works); **Save** a setting; **Remove** a model, toast with **Undo**, Undo pressed | drag, toggle, `primary`, `danger`, toasts, ○ Off, failed states |
| 8 | See how much free usage is left today. | stacked bar "N free requests left today across 3 providers"; provider groups with YOUR LIMIT / PROVIDER SAYS; reset countdowns | allowance group, stacked bar |
| end | Everything here is live. Press anything. | unpin; **Replay story** (`ghost`) scrolls back to step 0 | free play |

The live button in each step runs the same animation on click and never changes the step. In free play every control works against local state only. There is no network; all data is fictional, but realistic (provider and model names as seen in the owner's dashboard).

## 7. How it works

Eight explainers, each a heading, 2 to 4 plain sentences and one small widget reused from the story:

1. **Buckets.** Apps ask for `smart` or `fast`, not a model. A bucket ranks by score or by speed and picks at random among the models within 20% of the best available one, so load spreads out.
2. **Failover.** A rate-limited, down or broken model is skipped and the next one answers straight away, with no sleeping. A request pinned to one model and a request to a bucket fail over differently.
3. **Several keys per provider.** Keys are used in turn; a limited key is skipped. Keys live in their own file, never in your settings file.
4. **Statuses and the error brain.** The five statuses; errors explained in plain words; the error brain says how sure it is and asks you to review when it isn't.
5. **Allowance.** What's left today, "your limit" vs "provider says", and reset countdowns.
6. **Setup with AI.** Presets marked free or paid, Add models with AI, Get rate limits with AI, Rank with AI.
7. **Every request on record.** Request IDs, the full journey of each request, and the Playground.
8. **Safe with your settings and money.** flexrouter never rewrites your settings file; dashboard changes are kept in a separate file and can be reset; a budget cap can hold any paid provider at $0.

Closing line: it works with any OpenAI-compatible app, and there's a Python client if you want one.

Before merge, the owner checks each explainer against 2.3 as shipped (§10).

## 8. `/quickstart`

Rewritten to the 2.3 dashboard-first path (PLAN-V2.3 Session 18/19):

1. Install: `pip install git+https://github.com/notnotnotnoone/flexrouter` (or PyPI if 2.3 publishes there).
2. `flexrouter dashboard` opens it in the browser.
3. Add a provider from the presets and paste its key; it ticks when the key test passes.
4. Add models with AI, then Test all.
5. Point your app at `http://localhost:4891/v1` and use a bucket name as the model; Copy Python / Copy curl.

Folds: "Prefer editing the file by hand?" (the YAML) and "Calling it from Python" (the client). Everything else links to the router repo's docs once Session 19 has rewritten them.

## 9. Phones and motion

- **Phones (down to 375px, 16px gutters, no sideways scroll):** the story still tilts in and pins. The sidebar becomes one line at the top of the window ("Buckets ▾"), narration sits above in smaller type, rows stack (name, then pill and button), and drag uses tap then tap. Scale 0.7 to 0.9 on the way in, as the pasted component does.
- **Reduced motion (OS setting):** the container starts flat; the hero word swaps without sliding; story steps crossfade with no travel, shake or pop; spinners become a slow pulse; colours and words still change. No site toggle.

## 10. Blocked on 2.3 (placeholders until then)

- Dashboard screenshots for the tour.
- Checking the eight explainers and the quickstart against 2.3 as shipped (status names, Status page, Get started card, Test all, pinned vs bucket failover).
- The install command (git vs PyPI).
- The link to the rewritten Getting Started doc.

## 11. Testing

- `npm run build` (static export) and `npm run lint` pass.
- In the browser pane, at 1280×800 and 375×812, check:
  - every story step forwards and backwards
  - the live button of each step
  - free play and Replay
  - no console errors
  - no sideways scroll on phones
- The same checks with reduced motion emulated.
- A check that fails the build if any `src/` file contains `—`, or `–` used as a dash.

## 12. Out of scope

A docs system, light theme, a motion toggle, live data from a real flexrouter, analytics, reworking stash or agora, and fixing the router repo's outdated docs (that's PLAN-V2.3 Session 19).
