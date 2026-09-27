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

    if (path === "/") {
      await page.waitForTimeout(1200);
      const opacity = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-title")).opacity));
      if (opacity < 0.99) {
        failed = true;
        console.error(`[${r.name}] ${path}: hero title opacity is ${opacity}, expected it visible (1)`);
      }
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
