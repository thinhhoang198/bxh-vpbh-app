import { describe, expect, it } from "vitest";
import {
  addDays, countdownTo, formatCountdown, formatDate, formatDateTime, formatNumber,
  formatTime, formatVnd, formatWeekRange, weekStatusAt,
} from "./format";

describe("format", () => {
  it("uses dots for thousands", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(12)).toBe("12");
    expect(formatVnd(1_000_000)).toBe("1.000.000 VNĐ");
  });
  it("formats dates dd/MM/yyyy", () => {
    expect(formatDate("2026-10-12")).toBe("12/10/2026");
    expect(formatDate("2026-11-20T10:00+07:00")).toBe("20/11/2026");
  });
  it("converts to Vietnam time, never shows seconds", () => {
    expect(formatTime("2026-11-20T03:05:59Z")).toBe("10:05");
    expect(formatTime("2026-11-20T23:30+07:00")).toBe("23:30");
    expect(formatDateTime("2026-11-20T20:00Z")).toBe("03:00, 21/11/2026");
  });
  it("computes week status", () => {
    const w = { start: "2026-10-12", end: "2026-10-18" };
    expect(weekStatusAt(w, Date.parse("2026-10-11T23:59+07:00"))).toBe("upcoming");
    expect(weekStatusAt(w, Date.parse("2026-10-12T00:00+07:00"))).toBe("ongoing");
    expect(weekStatusAt(w, Date.parse("2026-10-18T23:59+07:00"))).toBe("ongoing");
    expect(weekStatusAt(w, Date.parse("2026-10-19T00:00+07:00"))).toBe("ended");
  });
  it("adds days and formats ranges", () => {
    expect(addDays("2026-10-12", 6)).toBe("2026-10-18");
    expect(formatWeekRange({ start: "2026-10-12", end: "2026-10-18" })).toBe("12/10 - 18/10");
  });
  it("counts down in minutes", () => {
    const now = Date.parse("2026-10-16T10:00+07:00");
    const c = countdownTo(Date.parse("2026-10-18T23:59+07:00"), now);
    expect(formatCountdown(c)).toBe("2 ngày 13 giờ 59 phút");
    expect(countdownTo(now - 1, now).done).toBe(true);
  });
});
