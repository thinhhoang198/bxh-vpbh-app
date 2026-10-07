import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { SummarySchema, WeekResponseSchema } from "../src/lib/types";

// Load Code.gs as-is into a sandbox (it only needs standard JS for the pure part).
const sandbox: Record<string, unknown> = { console };
runInNewContext(readFileSync(join(import.meta.dirname, "Code.gs"), "utf8"), sandbox);
const gs = sandbox as {
  buildSnapshot_: (cfg: unknown, rows: unknown[][], now: number) => { summary: unknown; weeks: Record<number, unknown[]> };
  maskPhone_: (v: unknown) => string | null;
  properCase_: (s: string) => string;
  toMs_: (v: unknown) => number;
};
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const vn = (s: string) => new Date(`${s}+07:00`);
const CFG = {
  programStart: vn("2026-10-12T00:00"),
  programEnd: vn("2026-12-27T00:00"),
  minGuests: 5,
  prizeVnd: 1_000_000,
  weekAnchor: vn("2026-10-05T00:00"), // Cấu hình!C13 in the real sheet
  dataTimes: [vn("2026-10-05T08:25"), "", vn("2026-10-21T09:15")],
  totalWeeks: 11,
};
const NOW = vn("2026-10-21T10:30").getTime(); // Wednesday of week 2

type P = { phone: string | number; name: string; agency?: string; guests?: number; visits?: number; last?: Date | string; key?: number; wg?: Record<number, number>; wk?: Record<number, number> };
function row(p: P): unknown[] {
  const r: unknown[] = new Array(43).fill("");
  r[0] = "SECRET-A"; r[1] = "SECRET-CUSTOMER-NAME"; r[5] = "SECRET-CCCD-079123456789"; r[9] = "FLAG-INTERNAL"; r[11] = "SECRET-L"; r[12] = "SECRET-M";
  r[2] = p.phone; r[3] = p.name; r[4] = p.agency ?? "ANB"; r[5] = (p.agency ?? "ANB").toUpperCase();
  r[6] = p.guests ?? 0; r[7] = p.visits ?? 0; r[8] = p.last ?? ""; r[10] = p.key ?? 0;
  for (let k = 1; k <= 15; k++) { r[13 + k - 1] = p.wg?.[k] ?? 0; r[28 + k - 1] = p.wk?.[k] ?? 0; }
  return r;
}

const ROWS = [
  row({ phone: "0797123333", name: "  nguyễn   văn an ", agency: "ANB", guests: 7, visits: 3, last: vn("2026-10-20T15:45"), key: 700, wg: { 1: 4, 2: 3 }, wk: { 1: 400, 2: 300 } }),
  row({ phone: "0912000111", name: "TRẦN THỊ BÌNH", agency: "QS LAND", guests: 7, visits: 2, last: vn("2026-10-21T09:15"), key: 700, wg: { 1: 2, 2: 5 }, wk: { 1: 200, 2: 500 } }),
  row({ phone: "0933444555", name: "lê hoàng", agency: "THE ONE", guests: 3, visits: 1, last: vn("2026-10-10T08:00"), key: 300, wg: { 1: 3 }, wk: { 1: 300 } }),
  row({ phone: 987654321, name: "Số Không Đầu", guests: 1, visits: 1, last: "2026-10-15 12:00", key: 100, wg: { 1: 1 }, wk: { 1: 100 } }),
  row({ phone: "", name: "Hàng trống" }),
  row({ phone: "0900000000", name: "Chưa có điểm", guests: 0 }),
];

describe("Code.gs helpers", () => {
  it("masks phones to 4 digits + *** + 3 digits", () => {
    expect(gs.maskPhone_("0797123333")).toBe("0797***333");
    expect(gs.maskPhone_("0797 123 333")).toBe("0797***333");
    expect(gs.maskPhone_(797123333)).toBe("0797***333"); // Sheets dropped the leading zero
    expect(gs.maskPhone_("123")).toBeNull();
  });
  it("capitalises names", () => {
    expect(gs.properCase_("  nguyễn   văn an ")).toBe("Nguyễn Văn An");
    expect(gs.properCase_("TRẦN THỊ BÌNH")).toBe("Trần Thị Bình");
    expect(gs.properCase_("Nguyễn Văn An")).toBe("Nguyễn Văn An");
    expect(gs.properCase_("Nguyễn Thị O'Neil")).toBe("Nguyễn Thị O'Neil"); // mixed case is left alone
  });
  it("parses date text and cells", () => {
    expect(gs.toMs_("07/10/2026")).toBe(vn("2026-10-07T00:00").getTime());
    expect(gs.toMs_("2026-10-07 09:30")).toBe(vn("2026-10-07T09:30").getTime());
    expect(Number.isNaN(gs.toMs_("abc"))).toBe(true);
    // Sheets serial number (cell formatted as a plain number) = 2026-10-21 10:30
    expect(gs.toMs_(46316.4375)).toBe(vn("2026-10-21T10:30").getTime());
    expect(Number.isNaN(gs.toMs_(7))).toBe(true); // small numbers are never dates
  });
});

describe("Code.gs snapshot", () => {
  const snap = gs.buildSnapshot_(CFG, ROWS, NOW);
  const summary = plain(snap.summary) as ReturnType<typeof SummarySchema.parse>;

  it("matches the public contract", () => {
    expect(() => SummarySchema.parse(summary)).not.toThrow();
    for (let w = 1; w <= 11; w++) expect(() => WeekResponseSchema.parse({ week: w, entries: plain(snap.weeks[w]) })).not.toThrow();
  });
  it("never leaks full phones or non-public columns", () => {
    const all = JSON.stringify([summary, snap.weeks]);
    for (const secret of ["0797123333", "0912000111", "987654321", "SECRET", "FLAG-INTERNAL", "079123456789"]) {
      expect(all).not.toContain(secret);
    }
    expect(all).not.toMatch(/T\d{2}:\d{2}:\d{2}/);
  });
  it("ranks by key, equal keys share a rank, ties keep sheet order", () => {
    expect(summary.overall.map((e) => [e.name, e.rank])).toEqual([
      ["Nguyễn Văn An", 1],
      ["Trần Thị Bình", 1],
      ["Lê Hoàng", 3],
      ["Số Không Đầu", 4],
    ]);
    expect(summary.overall[3].phoneMasked).toBe("0987***321");
    expect(summary.overall[0].lastCheckin).toBe("2026-10-20T15:45+07:00");
  });
  it("totals and dataAsOf", () => {
    expect(summary.totals).toEqual({ guests: 18, cvkdCount: 4, visits: 7 });
    expect(summary.meta.dataAsOf).toBe("2026-10-21T09:15+07:00"); // newest row of Dữ liệu!C
    expect(summary.meta.generatedAt).toBe("2026-10-21T10:30+07:00");
  });
  it("builds seven-day weeks from Monday 12/10 (C13 = 05/10)", () => {
    const w = summary.meta.weeks;
    expect(w).toHaveLength(11);
    expect(w[0]).toMatchObject({ start: "2026-10-12", end: "2026-10-18", status: "ended" });
    expect(w[1]).toMatchObject({ start: "2026-10-19", end: "2026-10-25", status: "ongoing" });
    expect(w[2].status).toBe("upcoming");
    expect(w[10]).toMatchObject({ start: "2026-12-21", end: "2026-12-27" });
    expect(summary.meta.currentWeek).toBe(2);
    expect(summary.meta.programStart).toBe("2026-10-12");
    expect(summary.meta.programEnd).toBe("2026-12-27");
  });
  it("lists per-week entries with weekly guests, only keys > 0", () => {
    const w2 = plain(snap.weeks[2]) as { name: string; rank: number; guests: number }[];
    expect(w2.map((e) => [e.name, e.rank, e.guests])).toEqual([["Trần Thị Bình", 1, 5], ["Nguyễn Văn An", 2, 3]]);
    expect(plain(summary.currentWeekEntries)).toEqual(w2.map((e) => expect.objectContaining({ name: e.name })));
    expect(summary.currentWeekEntries[0]).not.toHaveProperty("visits");
  });
  it("picks winners with the minimum-guest rule, none for upcoming weeks", () => {
    expect(summary.winners).toEqual([
      { week: 1, name: "Nguyễn Văn An", agency: "ANB", guests: 4, qualified: false, prizeVnd: 0 },
      { week: 2, name: "Trần Thị Bình", agency: "QS LAND", guests: 5, qualified: true, prizeVnd: 1_000_000 },
    ]);
  });
  it("handles a sheet with no check-ins yet", () => {
    const empty = plain(gs.buildSnapshot_({ ...CFG, dataTimes: [] }, [row({ phone: "0797123333", name: "a" })], vn("2026-10-05T10:00").getTime()).summary) as typeof summary;
    expect(() => SummarySchema.parse(empty)).not.toThrow();
    expect(empty.meta.dataAsOf).toBeNull();
    expect(empty.meta.currentWeek).toBe(0);
    expect(empty.overall).toEqual([]);
    expect(empty.winners).toEqual([]);
  });
  it("before the program starts, dataAsOf still shows the newest imported check-in", () => {
    const pre = plain(gs.buildSnapshot_({ ...CFG, dataTimes: [vn("2026-10-05T08:25")] }, [], vn("2026-10-05T10:00").getTime()).summary) as typeof summary;
    expect(pre.meta.dataAsOf).toBe("2026-10-05T08:25+07:00");
    expect(pre.meta.currentWeek).toBe(0);
    expect(pre.meta.weeks.every((w) => w.status === "upcoming")).toBe(true);
  });
});
