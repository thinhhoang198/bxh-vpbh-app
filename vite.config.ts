import { existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadEnv } from "vite";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Dev only: run the real api/leaderboard.ts handler inside the Vite dev server, so `npm run dev`
 * talks to the real Apps Script. Put APPS_SCRIPT_URL / APPS_SCRIPT_KEY (and optionally ACCESS_CODE)
 * in .env.local; they stay server-side and never reach the browser bundle.
 */
function devApi(mode: string): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), "");
      for (const k of ["APPS_SCRIPT_URL", "APPS_SCRIPT_KEY", "ACCESS_CODE"]) {
        if (env[k] && process.env[k] === undefined) process.env[k] = env[k];
      }
      server.middlewares.use("/api/leaderboard", (req: IncomingMessage, res: ServerResponse) => {
        void (async () => {
          const { default: handler } = (await server.ssrLoadModule("/api/leaderboard.ts")) as {
            default: (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
          };
          const query = Object.fromEntries(new URL(req.url ?? "", "http://localhost").searchParams);
          const vres = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vres;
            },
            json(body: unknown) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(body));
              return vres;
            },
          }) as unknown as VercelResponse;
          await handler(Object.assign(req, { query }) as unknown as VercelRequest, vres);
        })().catch(() => {
          res.statusCode = 500;
          res.end('{"error":"dev_api_error"}');
        });
      });
    },
  };
}

/** Pick the logo once at build time so the browser never probes for missing files. */
const whiteLogo = ["logo-white.svg", "logo-white.png"].find((f) => existsSync(join(process.cwd(), "public", "brand", f)));

export default defineConfig(({ mode }) => ({
  define: { __LOGO_WHITE__: JSON.stringify(whiteLogo ? `/brand/${whiteLogo}` : "") },
  plugins: [react(), tailwindcss(), devApi(mode)],
  test: { environment: "node", include: ["src/**/*.test.ts", "api/**/*.test.ts", "apps-script/**/*.test.ts"] },
}));
