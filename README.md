# showcase

Source for [notnotnotnoone.github.io](https://notnotnotnoone.github.io) — a personal site with [flexrouter](https://github.com/notnotnotnoone/flexrouter) as the flagship project, plus an interactive routing simulation and a quickstart guide.

Next.js (static export), GSAP + Lenis for scroll animation.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Static export goes to `out/`. Deploys automatically to GitHub Pages on push to `master` via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
