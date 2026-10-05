/**
 * Generates deterministic mock data (public/mocks/*.json) matching src/lib/types.ts.
 * All people are fictional. Run: npm run gen-mock
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SummarySchema, WeekResponseSchema, type Entry, type Summary, type WeekMeta, type Winner } from "../src/lib/types";
import { addDays, endOfDayMs, startOfDayMs, weekStatusAt } from "../src/lib/format";

// Week 1 is extended: it starts Wednesday 07/10 and runs to Sunday 18/10 (12 days).
// From week 2 on, weeks are regular Monday-Sunday blocks counted from FIRST_MONDAY.
const PROGRAM_START = "2026-10-07";
const FIRST_MONDAY = "2026-10-12";
const PROGRAM_END = "2026-12-27";
const TOTAL_WEEKS = 11;
const MIN_GUESTS = 5;
const PRIZE = 1_000_000;
// Mock "current time": Friday of week 6
const NOW = Date.parse("2026-11-20T10:00:00+07:00");
const NO_WINNER_WEEK = 3; // capped so nobody reaches 5 guests

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261012);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

const REAL_AGENCIES = ["ANB", "LANDMAX", "QS LAND", "KHẢI MINH LAND", "HAUSLAND", "SMARTLAND", "DWELL REALTY VIỆT NAM", "TAS LAND", "ERA VIỆT NAM", "THE ONE"];
const AGENCIES = [...REAL_AGENCIES, ...Array.from({ length: 21 }, (_, i) => `ĐẠI LÝ MẪU ${String(i + 1).padStart(2, "0")}`)];

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô", "Dương", "Lý"];
const DEM = ["Văn", "Thị", "Minh", "Quốc", "Ngọc", "Thanh", "Hữu", "Gia", "Đức", "Khánh", "Bảo", "Tuấn"];
const TEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Hạnh", "Khoa", "Lan", "Mai", "Nam", "Oanh", "Phúc", "Quân", "Sơn", "Trang", "Uyên", "Việt", "Yến", "Đạt", "Thảo"];

type Cvkd = { name: string; agency: string; phone: string; events: { t: number; guests: number }[] };

const mask = (p: string) => `${p.slice(0, 4)}***${p.slice(-3)}`;

function weekBounds(w: number) {
  const start = w === 1 ? PROGRAM_START : addDays(FIRST_MONDAY, (w - 1) * 7);
  const end = w === TOTAL_WEEKS ? PROGRAM_END : addDays(FIRST_MONDAY, (w - 1) * 7 + 6);
  return { start, end };
}

const weeks: WeekMeta[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
  const { start, end } = weekBounds(i + 1);
  return { week: i + 1, start, end, status: weekStatusAt({ start, end }, NOW) };
});
const currentWeek = weeks.find((w) => w.status === "ongoing")?.week ?? 0;

function makeCvkd(i: number): Cvkd {
  const agency = AGENCIES[i % AGENCIES.length];
  let name = `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;
  if (i === 7) name = "Nguyễn Thị Phương Thảo Quỳnh Như Diễm Trang Anh";
  const phone = `0${pick(["3", "7", "8", "9"])}${String(int(0, 99999999)).padStart(8, "0")}`;
  const activity = rand() ** 2 * 1.6 + 0.1;
  const events: Cvkd["events"] = [];
  for (const w of weeks) {
    if (w.status === "upcoming") continue;
    const from = startOfDayMs(w.start);
    const to = Math.min(endOfDayMs(w.end), NOW);
    let total = Math.floor(rand() * 8 * activity);
    if (w.week === NO_WINNER_WEEK) total = Math.min(total, 4);
    let left = total;
    while (left > 0) {
      const g = Math.min(left, rand() < 0.7 ? 1 : 2);
      const t = Math.floor((from + rand() * (to - from)) / 60_000) * 60_000;
      events.push({ t, guests: g });
      left -= g;
    }
  }
  return { name, agency, phone, events };
}

const cvkds = Array.from({ length: 150 }, (_, i) => makeCvkd(i));
// Absolute ties: clone a few people (identical events) so overall AND weekly ranks tie.
for (const [src, dst] of [[20, 21], [40, 41], [60, 61]]) {
  cvkds[dst].events = cvkds[src].events.map((e) => ({ ...e }));
}
// Guarantee a qualified leader in week 1 and a 5-guest tie-break by earlier time.
cvkds[1].events.push({ t: startOfDayMs(weeks[0].start) + 9 * 3600_000, guests: 6 });

const MIN_MS = 60_000;
/** Sort key: more guests first, then earlier time of reaching that count. */
function key(events: Cvkd["events"]): { guests: number; visits: number; last: number; key: number } {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const guests = sorted.reduce((s, e) => s + e.guests, 0);
  if (!guests) return { guests: 0, visits: 0, last: 0, key: 0 };
  const reach = sorted[sorted.length - 1].t / MIN_MS;
  return { guests, visits: sorted.length, last: sorted[sorted.length - 1].t, key: guests * 1e8 - reach + 1e7 };
}

function iso(ms: number): string {
  const d = new Date(ms + 7 * 3600_000);
  return `${d.toISOString().slice(0, 16)}+07:00`;
}

type Row = { c: Cvkd; idx: number; k: ReturnType<typeof key> };
function rankRows(rows: Row[], limit: number, overall: boolean): Entry[] {
  const sorted = rows.filter((r) => r.k.key > 0).sort((a, b) => b.k.key - a.k.key || a.idx - b.idx).slice(0, limit);
  const all = rows.filter((r) => r.k.key > 0);
  return sorted.map((r) => ({
    rank: 1 + all.filter((o) => o.k.key > r.k.key).length,
    name: r.c.name,
    agency: r.c.agency,
    phoneMasked: mask(r.c.phone),
    guests: r.k.guests,
    ...(overall ? { visits: r.k.visits, lastCheckin: iso(r.k.last) } : {}),
  }));
}

const weekEntries = (w: number, limit = 200) => {
  const { start, end } = weekBounds(w);
  const from = startOfDayMs(start);
  const to = endOfDayMs(end);
  return rankRows(
    cvkds.map((c, idx) => ({ c, idx, k: key(c.events.filter((e) => e.t >= from && e.t <= to)) })),
    limit,
    false,
  );
};

const overall = rankRows(cvkds.map((c, idx) => ({ c, idx, k: key(c.events) })), 300, true);
const allEvents = cvkds.flatMap((c) => c.events);
const lastEventMs = Math.max(...allEvents.map((e) => e.t));

const winners: Winner[] = weeks
  .filter((w) => w.status !== "upcoming")
  .flatMap((w) => {
    const top = weekEntries(w.week)[0];
    return top
      ? [{ week: w.week, name: top.name, agency: top.agency, guests: top.guests, qualified: top.guests >= MIN_GUESTS, prizeVnd: top.guests >= MIN_GUESTS ? PRIZE : 0 }]
      : [];
  });

const summary: Summary = {
  meta: {
    generatedAt: iso(NOW),
    dataAsOf: iso(lastEventMs),
    programStart: PROGRAM_START,
    programEnd: PROGRAM_END,
    currentWeek,
    totalWeeks: TOTAL_WEEKS,
    minGuestsPerWeek: MIN_GUESTS,
    weeklyPrizeVnd: PRIZE,
    weeks,
  },
  totals: {
    guests: allEvents.reduce((s, e) => s + e.guests, 0),
    cvkdCount: overall.length,
    visits: allEvents.length,
  },
  overall,
  currentWeekEntries: currentWeek ? weekEntries(currentWeek) : [],
  winners,
};

const out = join(import.meta.dirname, "..", "public", "mocks");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "summary.json"), JSON.stringify(SummarySchema.parse(summary)));
for (let w = 1; w <= TOTAL_WEEKS; w++) {
  const res = WeekResponseSchema.parse({ week: w, entries: weeks[w - 1].status === "upcoming" ? [] : weekEntries(w) });
  writeFileSync(join(out, `week-${w}.json`), JSON.stringify(res));
}
console.log(`mocks written: ${overall.length} ranked CVKD, current week ${currentWeek}, ${winners.length} winner rows`);
