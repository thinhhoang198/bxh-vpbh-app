import { createHash, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SummarySchema, WeekResponseSchema } from "../src/lib/types.js";

/**
 * Same-origin proxy in front of the Apps Script web app.
 * The browser never sees APPS_SCRIPT_URL / APPS_SCRIPT_KEY / ACCESS_CODE. Responses are re-validated
 * with the public zod schemas, which also strips any field that is not part of the public contract.
 */

const UPSTREAM_TIMEOUT_MS = 10_000;
const MEMORY_TTL_MS = 60_000;
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const PRIVATE_CACHE = "private, max-age=30";

const memory = new Map<string, { at: number; body: unknown }>();

const digest = (s: string) => createHash("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

function send(res: VercelResponse, status: number, body: unknown, cache: string) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", cache);
  res.status(status).json(body);
}

async function readUpstream(week: number | null): Promise<unknown> {
  const url = new URL(process.env.APPS_SCRIPT_URL as string);
  url.searchParams.set("action", week ? "week" : "summary");
  if (week) url.searchParams.set("week", String(week));
  url.searchParams.set("key", process.env.APPS_SCRIPT_KEY ?? "");
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`upstream status ${res.status}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "method_not_allowed" }, "no-store");
  }

  const accessCode = process.env.ACCESS_CODE;
  if (accessCode) {
    const given = req.headers["x-access-code"];
    if (typeof given !== "string" || !sameSecret(given, accessCode)) {
      return send(res, 401, { error: "unauthorized" }, "no-store");
    }
  }
  const cache = accessCode ? PRIVATE_CACHE : PUBLIC_CACHE;

  const rawWeek = req.query.week;
  let week: number | null = null;
  if (rawWeek !== undefined) {
    const n = Number(Array.isArray(rawWeek) ? rawWeek[0] : rawWeek);
    if (!Number.isInteger(n) || n < 1 || n > 15) return send(res, 400, { error: "bad_request" }, "no-store");
    week = n;
  }

  // With an access code the CDN must not cache publicly, so protect Apps Script with a short memory cache.
  const memKey = String(week ?? "summary");
  if (accessCode) {
    const hit = memory.get(memKey);
    if (hit && Date.now() - hit.at < MEMORY_TTL_MS) return send(res, 200, hit.body, cache);
  }

  if (!process.env.APPS_SCRIPT_URL) {
    console.error("leaderboard: APPS_SCRIPT_URL is not set");
    return send(res, 503, { error: "not_configured" }, "no-store");
  }

  try {
    const raw = await readUpstream(week);
    const body = week ? WeekResponseSchema.parse(raw) : SummarySchema.parse(raw);
    if (accessCode) memory.set(memKey, { at: Date.now(), body });
    return send(res, 200, body, cache);
  } catch (err) {
    // Log the error class only: messages from fetch can contain the upstream URL (and key).
    console.error("leaderboard upstream failure:", err instanceof Error ? err.name : "unknown");
    return send(res, 502, { error: "upstream_unavailable" }, "no-store");
  }
}

/** Test hook: clears the in-memory cache between tests. */
export const __resetMemoryCache = () => memory.clear();
