import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type TabId = "week" | "overall" | "prizes";
const TABS: TabId[] = ["week", "overall", "prizes"];

export function useViewParams() {
  const [sp, setSp] = useSearchParams();
  const rawTab = sp.get("tab");
  const tab: TabId = TABS.includes(rawTab as TabId) ? (rawTab as TabId) : "week";
  const weekNum = Number(sp.get("week"));
  const week = Number.isInteger(weekNum) && weekNum > 0 ? weekNum : null;

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      setSp(next, { replace: true });
    },
    [sp, setSp],
  );

  return { tab, week, q: sp.get("q") ?? "", agency: sp.get("agency") ?? "", update };
}
