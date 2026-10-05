import { useCallback, useState } from "react";

const STORAGE_KEY = "bxh.pinned";

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** "Ghim tôi": remembers one entry key per browser (localStorage, no tracking). */
export function usePinned() {
  const [key, setKey] = useState(read);
  const toggle = useCallback((k: string) => {
    setKey((cur) => {
      const next = cur === k ? "" : k;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, next);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable: pin lasts for this page view only */
      }
      return next;
    });
  }, []);
  return { key, toggle };
}
