import { useEffect, useState } from "react";
import { parseIso } from "./format";

// Time simulation (?now=2026-11-20T10:00) is available in dev builds only, or in a QA build
// made explicitly with VITE_ALLOW_SIM=1 (never set this on the production deployment).
const simOffset = (() => {
  if (!import.meta.env.DEV && import.meta.env.VITE_ALLOW_SIM !== "1") return 0;
  const raw = new URLSearchParams(window.location.search).get("now");
  const ms = raw ? parseIso(raw) : NaN;
  return Number.isFinite(ms) ? ms - Date.now() : 0;
})();

export const currentMs = () => Date.now() + simOffset;

/** Current time, re-evaluated every 30s (minutes are the finest unit shown). */
export function useNow(): number {
  const [now, setNow] = useState(currentMs);
  useEffect(() => {
    const id = setInterval(() => setNow(currentMs()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
