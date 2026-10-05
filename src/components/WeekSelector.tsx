import { useEffect, useRef } from "react";
import { formatWeekRange } from "../lib/format";
import type { WeekMeta } from "../lib/types";

const STATUS_LABEL: Record<WeekMeta["status"], string> = {
  ended: "Đã kết thúc",
  ongoing: "Đang diễn ra",
  upcoming: "Sắp tới",
};

type Props = { weeks: WeekMeta[]; selected: number; onSelect: (week: number) => void };

export function WeekSelector({ weeks, selected, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [selected]);

  return (
    <nav aria-label="Chọn tuần">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {weeks.map((w) => {
          const on = w.week === selected;
          return (
            <li key={w.week} className="shrink-0">
              <button
                ref={on ? activeRef : undefined}
                onClick={() => onSelect(w.week)}
                aria-current={on ? "true" : undefined}
                className={`flex w-[104px] flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors ${
                  on
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-purple-100 bg-white text-ink hover:border-purple-600/40"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {w.status === "ongoing" && (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                  Tuần {w.week}
                </span>
                <span className={`text-[11px] ${on ? "text-purple-100" : "text-grey-600"}`}>
                  {formatWeekRange(w)}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    on ? "text-white" : w.status === "ongoing" ? "text-orange-800" : "text-grey-600"
                  }`}
                >
                  {STATUS_LABEL[w.status]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
