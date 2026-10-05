import { useEffect, useRef, useState } from "react";

/** Counts up once on first mount; later changes jump straight to the new value. */
export function useCountUp(target: number, durationMs = 700): number {
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reduce ? target : 0);
  const animated = useRef(reduce);

  useEffect(() => {
    if (animated.current) {
      setValue(target);
      return;
    }
    animated.current = true;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
