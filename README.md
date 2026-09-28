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
npm run smoke       # browser walk-through; needs `npm run dev` running and `npx playwright install chromium` once
```

Copy rule: no em dashes or en dashes anywhere under `src/`. The build fails if one gets in.

## Deploy

Pushing to `master` deploys to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Dashboard screenshots

`public/tour/*.png` are the flexrouter 2.3.0 dashboard at 1600x1000 in dark mode, run against the router's demo data (fake keys), not anyone's real setup. The Settings shot is scrolled past the Server box because its Data folder field shows a local path. Retake them only when the dashboard changes.
