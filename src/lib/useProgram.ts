import { useMemo } from "react";
import { endOfDayMs, startOfDayMs, weekStatusAt } from "./format";
import type { Summary, WeekMeta } from "./types";

/** Week statuses and program phase evaluated against the client clock. */
export function useProgram(meta: Summary["meta"] | undefined, now: number) {
  return useMemo(() => {
    if (!meta) return { weeks: [] as WeekMeta[], defaultWeek: 1, notStarted: false, ended: false };
    // Re-evaluated on the client so statuses flip at midnight without a refetch.
    const weeks = meta.weeks.map((w) => ({ ...w, status: weekStatusAt(w, now) }));
    const live = weeks.find((w) => w.status === "ongoing");
    const defaultWeek = live ? live.week : weeks[0]?.status === "upcoming" ? 1 : meta.totalWeeks;
    return {
      weeks,
      defaultWeek,
      notStarted: now < startOfDayMs(meta.programStart),
      ended: now > endOfDayMs(meta.programEnd),
    };
  }, [meta, now]);
}
