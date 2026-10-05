import { readFileSync, existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function mockHandler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "", "http://x");
  // Optional: MOCK_ACCESS_CODE=abc npm run dev  -> exercises the 401 / access gate flow.
  const need = process.env.MOCK_ACCESS_CODE;
  if (need && req.headers["x-access-code"] !== need) {
    res.statusCode = 401;
    res.end('{"error":"unauthorized"}');
    return;
  }
  const week = Number(url.searchParams.get("week"));
  const file = join(process.cwd(), "public", "mocks", week ? `week-${week}.json` : "summary.json");
  res.setHeader("Content-Type", "application/json");
  if (!existsSync(file)) {
    res.statusCode = 404;
    res.end('{"error":"not_found"}');
    return;
  }
  res.end(readFileSync(file));
}

/** Local only (dev and `vite preview`): serve /api/leaderboard from public/mocks, no backend needed. */
function mockApi(): Plugin {
  return {
    name: "mock-api",
    configureServer: (server) => void server.middlewares.use("/api/leaderboard", mockHandler),
    configurePreviewServer: (server) => void server.middlewares.use("/api/leaderboard", mockHandler),
  };
}

/** Pick the logo once at build time so the browser never probes for missing files. */
const whiteLogo = ["logo-white.svg", "logo-white.png"].find((f) => existsSync(join(process.cwd(), "public", "brand", f)));

export default defineConfig({
  define: { __LOGO_WHITE__: JSON.stringify(whiteLogo ? `/brand/${whiteLogo}` : "") },
  plugins: [react(), tailwindcss(), mockApi()],
  test: { environment: "node", include: ["src/**/*.test.ts", "api/**/*.test.ts", "apps-script/**/*.test.ts"] },
});
