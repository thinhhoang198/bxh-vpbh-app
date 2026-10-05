import { SummarySchema, WeekResponseSchema, type Summary, type WeekResponse } from "./types";

const ACCESS_KEY = "bxh.accessCode";

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

export function getAccessCode(): string {
  try {
    return sessionStorage.getItem(ACCESS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAccessCode(code: string): void {
  try {
    sessionStorage.setItem(ACCESS_KEY, code);
  } catch {
    /* storage unavailable: code lives for this request only */
  }
}

async function getJson(url: string): Promise<unknown> {
  const code = getAccessCode();
  const res = await fetch(url, { headers: code ? { "x-access-code": code } : undefined });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSummary(): Promise<Summary> {
  return SummarySchema.parse(await getJson("/api/leaderboard"));
}

export async function fetchWeek(week: number): Promise<WeekResponse> {
  return WeekResponseSchema.parse(await getJson(`/api/leaderboard?week=${week}`));
}
