import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, { __resetMemoryCache } from "./leaderboard";

// Test-only fixture: the smallest payloads that satisfy the public contract.
const entry = { rank: 1, name: "Test One", agency: "ANB", phoneMasked: "0900***000", guests: 5 };
const SUMMARY = {
  meta: {
    generatedAt: "2026-10-21T10:30+07:00",
    dataAsOf: null,
    programStart: "2026-10-12",
    programEnd: "2026-12-27",
    currentWeek: 1,
    totalWeeks: 11,
    minGuestsPerWeek: 5,
    weeklyPrizeVnd: 1_000_000,
    weeks: [{ week: 1, start: "2026-10-12", end: "2026-10-18", status: "ongoing" }],
  },
  totals: { guests: 5, cvkdCount: 1, visits: 1 },
  overall: [{ ...entry, visits: 1 }],
  currentWeekEntries: [entry],
  winners: [],
};
const WEEK = { week: 3, entries: [entry] };

function call(opts: { method?: string; query?: Record<string, string>; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = {};
  const out = { status: 0, body: undefined as unknown };
  const res = {
    setHeader: (k: string, v: string) => void (headers[k.toLowerCase()] = v),
    status(code: number) { out.status = code; return res; },
    json(b: unknown) { out.body = b; return res; },
  } as unknown as VercelResponse;
  const req = { method: opts.method ?? "GET", query: opts.query ?? {}, headers: opts.headers ?? {} } as unknown as VercelRequest;
  return handler(req, res).then(() => ({ ...out, headers }));
}

const SECRET_URL = "https://script.google.com/macros/s/SECRET-DEPLOYMENT/exec";
const SECRET_KEY = "SECRET-API-KEY";
const upstream = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body)));

beforeEach(() => {
  vi.stubEnv("APPS_SCRIPT_URL", SECRET_URL);
  vi.stubEnv("APPS_SCRIPT_KEY", SECRET_KEY);
  vi.stubEnv("ACCESS_CODE", "");
  vi.stubGlobal("fetch", upstream(SUMMARY));
  __resetMemoryCache();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/api/leaderboard", () => {
  it("serves the summary with public CDN caching and noindex", async () => {
    const r = await call();
    expect(r.status).toBe(200);
    expect(r.headers["cache-control"]).toBe("public, s-maxage=60, stale-while-revalidate=300");
    expect(r.headers["x-robots-tag"]).toBe("noindex, nofollow");
    expect(r.body).toHaveProperty("overall");
  });
  it("serves a week and rejects bad week numbers", async () => {
    vi.stubGlobal("fetch", upstream(WEEK));
    expect((await call({ query: { week: "3" } })).body).toMatchObject({ week: 3 });
    expect((await call({ query: { week: "99" } })).status).toBe(400);
    expect((await call({ query: { week: "abc" } })).status).toBe(400);
  });
  it("only allows GET", async () => {
    expect((await call({ method: "POST" })).status).toBe(405);
  });
  it("reports 503 when the Apps Script URL is not configured", async () => {
    vi.stubEnv("APPS_SCRIPT_URL", "");
    const r = await call();
    expect(r.status).toBe(503);
    expect(r.body).toEqual({ error: "not_configured" });
  });

  describe("with ACCESS_CODE", () => {
    beforeEach(() => vi.stubEnv("ACCESS_CODE", "letmein"));
    it("rejects missing or wrong code with 401 and no caching", async () => {
      for (const headers of [{}, { "x-access-code": "nope" }] as Record<string, string>[]) {
        const r = await call({ headers });
        expect(r.status).toBe(401);
        expect(r.headers["cache-control"]).toBe("no-store");
      }
    });
    it("accepts the right code, uses private caching", async () => {
      const r = await call({ headers: { "x-access-code": "letmein" } });
      expect(r.status).toBe(200);
      expect(r.headers["cache-control"]).toBe("private, max-age=30");
    });
    it("caches in memory so Apps Script is not hit on every request", async () => {
      const fetchMock = upstream(SUMMARY);
      vi.stubGlobal("fetch", fetchMock);
      const headers = { "x-access-code": "letmein" };
      await call({ headers });
      await call({ headers });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("upstream (Apps Script)", () => {
    it("returns 502 without leaking URL or key when the source fails", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error(`fetch failed ${SECRET_URL}?key=${SECRET_KEY}`); }));
      const r = await call();
      expect(r.status).toBe(502);
      expect(JSON.stringify(r.body)).not.toMatch(/SECRET/);
    });
    it("returns 502 when the source returns an error payload", async () => {
      vi.stubGlobal("fetch", upstream({ error: "unauthorized" }));
      expect((await call()).status).toBe(502);
    });
    it("passes action and key upstream and drops non-public fields", async () => {
      const dirty = { ...SUMMARY, overall: [{ ...SUMMARY.overall[0], cccd: "079123456789" }] };
      const fetchMock = upstream(dirty);
      vi.stubGlobal("fetch", fetchMock);
      const r = await call();
      expect(r.status).toBe(200);
      const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
      expect(url).toContain("action=summary");
      expect(url).toContain(`key=${SECRET_KEY}`);
      expect(JSON.stringify(r.body)).not.toContain("079123456789");
    });
    it("rejects a payload that contains a full phone number", async () => {
      const bad = { ...SUMMARY, overall: [{ ...SUMMARY.overall[0], phoneMasked: "0900123000" }] };
      vi.stubGlobal("fetch", upstream(bad));
      expect((await call()).status).toBe(502);
    });
  });
});
