/**
 * Captures docs/screenshots/*.png with the system Edge/Chrome via playwright-core.
 * Needs a server with time simulation: `npm run dev` (default http://localhost:5199)
 * Usage: BASE_URL=http://localhost:5199 npm run screenshots
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:5199";
const NOW = "now=2026-11-20T10:00";
const out = join(import.meta.dirname, "..", "docs", "screenshots");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge" });

async function shot(name: string, width: number, height: number, query: string, fullPage = true) {
  // reducedMotion: full-page capture resizes the viewport, which would replay row animations mid-shot.
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${NOW}&${query}`);
  await page.waitForSelector("main ol, main ul, main table, main section", { timeout: 15000 });
  await page.waitForTimeout(1200); // let count-up and row animations finish
  await page.screenshot({ path: join(out, `${name}.png`), fullPage });
  await ctx.close();
}

for (const [w, h] of [[360, 800], [768, 1024], [1440, 900]] as const) {
  await shot(`week-${w}`, w, h, "");
  await shot(`overall-${w}`, w, h, "tab=overall");
}
await shot("prizes-1440", 1440, 900, "tab=prizes");

// TV mode: slide 1 = this week, ArrowRight moves to the next slide.
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/?${NOW}&tv=1`);
await page.waitForSelector("main ol");
for (const [i, name] of ["tv-week", "tv-overall", "tv-prizes"].entries()) {
  if (i > 0) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(out, `${name}-1920.png`) });
}
await ctx.close();
await browser.close();
console.log(`screenshots saved to ${out}`);
