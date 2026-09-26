# showcase

Source for [notnotnotnoone.github.io](https://notnotnotnoone.github.io): the site for [flexrouter](https://github.com/notnotnotnoone/flexrouter).

Next.js (static export), Tailwind CSS 4, framer-motion. The look copies the flexrouter dashboard; the scroll story on the home page plays every dashboard button and widget with fake data.

## Dev

```bash
npm install
npm run dev
```

## Checks

```bash
npm test            # unit and component tests (Vitest)
npm run lint
npm run build       # runs the no-dash check first, then the static export to out/
npm run smoke        # browser walk-through; needs `npm run dev` running and `npx playwright install chromium` once
```

Copy rule: no em dashes or en dashes anywhere under `src/`. The build fails if one gets in.

## Deploy

Pushing to `master` deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

The `v2-redesign` branch describes flexrouter 2.3 and must not be merged before 2.3 is released. Before merging:

- add the dashboard screenshots to `public/tour/` and set each `src` in `src/components/site/dashboard-tour.tsx`
- check the "How it works" text and the quickstart against 2.3 as shipped
- switch the install command to PyPI if 2.3 is published there
- link the quickstart to the rewritten Getting Started guide
