import type { WeekMeta } from "./types";

// Vietnam has no DST: a fixed +07:00 offset is exact and avoids Intl differences.
const VN_OFFSET_MS = 7 * 3600_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Shift a timestamp so that UTC getters return Vietnam wall-clock values. */
function vnParts(ms: number) {
  const d = new Date(ms + VN_OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    hh: d.getUTCHours(),
    mm: d.getUTCMinutes(),
  };
}

/** Parse an ISO string. Strings without an offset are treated as Vietnam time. */
export function parseIso(iso: string): number {
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/.test(iso);
  return Date.parse(hasZone ? iso : `${iso}+07:00`);
}

export function formatNumber(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatVnd(n: number): string {
  return `${formatNumber(n)} VNĐ`;
}

/** "2026-10-12" or any ISO datetime -> "12/10/2026" */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const p = vnParts(parseIso(value));
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

/** ISO datetime -> "HH:mm" (never seconds) */
export function formatTime(iso: string): string {
  const p = vnParts(parseIso(iso));
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

export function formatDateTime(iso: string): string {
  return `${formatTime(iso)}, ${formatDate(iso)}`;
}

/** "12/10" short form for week ranges */
export function formatDayMonth(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

export function formatWeekRange(w: Pick<WeekMeta, "start" | "end">): string {
  return `${formatDayMonth(w.start)} - ${formatDayMonth(w.end)}`;
}

/** End of a "yyyy-MM-dd" day (23:59 Vietnam time) as epoch ms. */
export function endOfDayMs(date: string): number {
  return Date.parse(`${date}T23:59:59.999+07:00`);
}

export function startOfDayMs(date: string): number {
  return Date.parse(`${date}T00:00:00+07:00`);
}

export function weekStatusAt(w: Pick<WeekMeta, "start" | "end">, nowMs: number): WeekMeta["status"] {
  if (nowMs < startOfDayMs(w.start)) return "upcoming";
  if (nowMs > endOfDayMs(w.end)) return "ended";
  return "ongoing";
}

/** Add days to a "yyyy-MM-dd" date. */
export function addDays(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export type Countdown = { days: number; hours: number; minutes: number; done: boolean };

export function countdownTo(targetMs: number, nowMs: number): Countdown {
  const diff = Math.max(0, targetMs - nowMs);
  const totalMin = Math.floor(diff / 60_000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
    done: diff === 0,
  };
}

/** Minutes only, no seconds anywhere in the UI. */
export function formatCountdown(c: Countdown): string {
  if (c.days > 0) return `${c.days} ngày ${c.hours} giờ ${c.minutes} phút`;
  return `${c.hours} giờ ${c.minutes} phút`;
}
