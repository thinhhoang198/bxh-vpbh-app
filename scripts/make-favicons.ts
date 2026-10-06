/**
 * Writes small PNG variants of public/favicon.ico (same artwork, only downscaled):
 *   public/favicon-32.png (tab icon, transparent), public/apple-touch-icon.png (180x180 on white:
 *   iOS fills transparent icons with black).
 * Usage: npx tsx scripts/make-favicons.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const dir = join(import.meta.dirname, "..", "public");
const ico = readFileSync(join(dir, "favicon.ico")).toString("base64");

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge" });
const page = await browser.newPage();
const out = await page.evaluate(async ([data, sizes]) => {
  const img = new Image();
  img.src = `data:image/x-icon;base64,${data}`;
  await img.decode();
  const result: Record<number, string> = {};
  for (const size of sizes) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    if (size === 180) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
    }
    const pad = size === 180 ? 24 : 0;
    ctx.drawImage(img, pad, pad, size - 2 * pad, size - 2 * pad);
    result[size] = c.toDataURL("image/png").split(",")[1];
  }
  return result;
}, [ico, [32, 180]] as const);
await browser.close();

for (const [size, name] of [[32, "favicon-32.png"], [180, "apple-touch-icon.png"]] as const) {
  const buf = Buffer.from(out[size], "base64");
  writeFileSync(join(dir, name), buf);
  console.log(`${name}: ${buf.length} bytes`);
}
