import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addDays } from "./format";
import { SummarySchema, WeekResponseSchema } from "./types";

const dir = join(process.cwd(), "public", "mocks");
const read = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8"));

describe("mock data contract", () => {
  const summary = SummarySchema.parse(read("summary.json"));

  it("never contains a full phone number or seconds", () => {
    for (const f of readdirSync(dir)) {
      const raw = readFileSync(join(dir, f), "utf8");
      expect(raw).not.toMatch(/\b0\d{9}\b/);
      expect(raw).not.toMatch(/T\d{2}:\d{2}:\d{2}/);
    }
  });
  it("is ordered by rank, with ties sharing a rank", () => {
    const ranks = summary.overall.map((e) => e.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBeLessThan(ranks.length);
  });
  it("covers qualified, unqualified and upcoming weeks", () => {
    expect(summary.winners.some((w) => w.qualified && w.prizeVnd === summary.meta.weeklyPrizeVnd)).toBe(true);
    expect(summary.winners.some((w) => !w.qualified && w.prizeVnd === 0)).toBe(true);
    expect(summary.meta.weeks.some((w) => w.status === "upcoming")).toBe(true);
    expect(summary.winners.length).toBe(summary.meta.weeks.filter((w) => w.status !== "upcoming").length);
  });
  it("has valid per-week files", () => {
    for (let w = 1; w <= summary.meta.totalWeeks; w++) {
      expect(WeekResponseSchema.parse(read(`week-${w}.json`)).week).toBe(w);
    }
  });
  it("has an extended week 1 (Wed 07/10 to Sun 18/10) then regular weeks, 11 in total ending Sun 27/12", () => {
    const { weeks, programStart, programEnd } = summary.meta;
    expect(programStart).toBe("2026-10-07");
    expect(weeks).toHaveLength(11);
    expect(programEnd).toBe("2026-12-27");
    expect(weeks[0]).toMatchObject({ start: "2026-10-07", end: "2026-10-18" });
    expect(weeks[1]).toMatchObject({ start: "2026-10-19", end: "2026-10-25" });
    expect(weeks[10]).toMatchObject({ start: "2026-12-21", end: programEnd });
    weeks.slice(1).forEach((w, i, a) => {
      if (i > 0) expect(w.start).toBe(addDays(a[i - 1].end, 1));
    });
  });
  it("includes a very long accented name", () => {
    expect(summary.overall.some((e) => e.name.length > 40)).toBe(true);
  });
});
