import { describe, expect, it } from "vitest";
import { filterByAgency, listAgencies, matchesQuery, normalize } from "./search";

const rows = [
  { name: "Đặng Thị Hạnh", agency: "KHẢI MINH LAND" },
  { name: "Lê Văn An", agency: "ANB" },
  { name: "Trần Bình", agency: "ANB" },
];

describe("search", () => {
  it("strips diacritics and case", () => {
    expect(normalize("  ĐẶNG  Thị Hạnh ")).toBe("dang thi hanh");
  });
  it("matches name or agency without accents", () => {
    expect(matchesQuery(rows[0], "dang thi")).toBe(true);
    expect(matchesQuery(rows[0], "KHAI minh")).toBe(true);
    expect(matchesQuery(rows[1], "khai")).toBe(false);
    expect(matchesQuery(rows[1], "   ")).toBe(false);
  });
  it("filters by agency keeping order", () => {
    expect(filterByAgency(rows, "ANB").map((r) => r.name)).toEqual(["Lê Văn An", "Trần Bình"]);
    expect(filterByAgency(rows, "")).toBe(rows);
  });
  it("lists unique agencies", () => {
    expect(listAgencies(rows)).toEqual(["ANB", "KHẢI MINH LAND"]);
  });
});
