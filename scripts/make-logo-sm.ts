/**
 * Writes public/brand/logo-color-sm.png: the SAME logo downscaled (aspect ratio kept, no other change)
 * so the header loads fast on mobile. The original logo-color.png is left untouched.
 * Usage: npx tsx scripts/make-logo-sm.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const dir = join(import.meta.dirname, "..", "public", "brand");
const src = readFileSync(join(dir, "logo-color.png")).toString("base64");
const TARGET_H = 168; // 3x the 56px desktop height, enough for high-DPI

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge" });
const page = await browser.newPage();
const b64 = await page.evaluate(
  async ([data, targetH]) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    let cur: CanvasImageSource = img;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const ratio = w / h;
    // Halve repeatedly for a clean downscale, then land exactly on the target size.
    while (h / 2 > targetH) {
      const c = document.createElement("canvas");
      c.width = Math.round(w / 2);
      c.height = Math.round(h / 2);
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cur, 0, 0, c.width, c.height);
      cur = c; w = c.width; h = c.height;
    }
    const out = document.createElement("canvas");
    out.height = targetH;
    out.width = Math.round(targetH * ratio);
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cur, 0, 0, out.width, out.height);
    return out.toDataURL("image/png").split(",")[1];
  },
  [src, TARGET_H] as const,
);
await browser.close();
const buf = Buffer.from(b64, "base64");
writeFileSync(join(dir, "logo-color-sm.png"), buf);
console.log(`logo-color-sm.png: ${buf.length} bytes, ${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`);
