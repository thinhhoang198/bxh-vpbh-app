import type { ReactNode } from "react";
import {
  countdownTo, endOfDayMs, formatCountdown, formatNumber, formatVnd, formatWeekRange, formatDateTime,
} from "../lib/format";
import { useWeek } from "../lib/queries";
import type { Entry, Summary, WeekMeta } from "../lib/types";

// All sizes are viewport-relative so the layout scales from 1280x720 to 4K.
// At 1920x1080: names 1.7vw = 32px, agency 1.2vw = 23px.

function Rank({ rank }: { rank: number }) {
  return (
    <span
      className={`flex h-[3.4vw] w-[3.4vw] items-center justify-center rounded-full text-[1.7vw] font-extrabold ${
        rank === 1 ? "bg-orange-500 text-purple-900" : "bg-white/15 text-white"
      }`}
    >
      {rank}
    </span>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return <ol className="flex min-h-0 flex-1 flex-col gap-[0.7vh]">{children}</ol>;
}

function RowShell({ first, cols, children }: { first: boolean; cols: string; children: ReactNode }) {
  return (
    <li
      className={`row-in grid min-h-0 flex-1 items-center gap-[1.5vw] rounded-[1.2vw] px-[1.5vw] ${cols} ${
        first ? "bg-orange-500 text-purple-900" : "bg-white/10 text-white"
      }`}
    >
      {children}
    </li>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center text-center text-[2.4vw] font-bold text-white">
      <p className="max-w-[60vw]">{children}</p>
    </div>
  );
}

function Strip({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-[1.2vh] flex items-baseline justify-between gap-[2vw] text-[1.5vw] font-semibold text-purple-100">
      <p>{left}</p>
      {right && <p>{right}</p>}
    </div>
  );
}

export function TvWeekSlide({
  summary, weeks, selected, now,
}: { summary: Summary; weeks: WeekMeta[]; selected: number; now: number }) {
  const { meta } = summary;
  const week = weeks.find((w) => w.week === selected) ?? weeks[0];
  const fromSummary = week.week === meta.currentWeek;
  const q = useWeek(week.week, !fromSummary && week.status !== "upcoming");
  const entries: Entry[] = (fromSummary ? summary.currentWeekEntries : (q.data?.entries ?? [])).slice(0, 10);
  const cd = countdownTo(endOfDayMs(week.end), now);

  const strip = (
    <Strip
      left={`Tuần ${week.week} | ${formatWeekRange(week)}${week.status === "ongoing" ? ` | Còn ${formatCountdown(cd)}` : ""}`}
      right={`Từ ${meta.minGuestsPerWeek} khách nhận ${formatVnd(meta.weeklyPrizeVnd)}`}
    />
  );
  if (week.status === "upcoming") return <>{strip}<Message>Tuần {week.week} chưa bắt đầu.</Message></>;
  if (entries.length === 0) {
    return <>{strip}<Message>Chưa có khách check-in trong tuần này. Hãy là người đầu tiên dẫn lối khách hàng!</Message></>;
  }
  return (
    <>
      {strip}
      <Rows>
        {entries.map((e, i) => (
          <RowShell key={`${e.phoneMasked}-${i}`} first={e.rank === 1} cols="grid-cols-[3.4vw_1fr_22vw_8vw_13vw]">
            <Rank rank={e.rank} />
            <span className="truncate text-[1.7vw] font-bold">{e.name}</span>
            <span className="truncate text-[1.2vw]">{e.agency}</span>
            <span className="text-right text-[2.2vw] font-extrabold">{e.guests}</span>
            <span className="text-[1.1vw] font-semibold">
              {e.guests >= meta.minGuestsPerWeek && <><span aria-hidden="true">✓</span> Đủ điều kiện</>}
            </span>
          </RowShell>
        ))}
      </Rows>
    </>
  );
}

export function TvOverallSlide({ summary }: { summary: Summary }) {
  const { overall, totals } = summary;
  const rows = overall.slice(0, 10);
  const strip = (
    <Strip
      left="Bảng xếp hạng tổng"
      right={`${formatNumber(totals.guests)} khách | ${formatNumber(totals.cvkdCount)} CVKD có điểm | ${formatNumber(totals.visits)} lượt check-in`}
    />
  );
  if (rows.length === 0) return <>{strip}<Message>Chưa có khách check-in.</Message></>;
  return (
    <>
      {strip}
      <Rows>
        {rows.map((e, i) => (
          <RowShell key={`${e.phoneMasked}-${i}`} first={e.rank === 1} cols="grid-cols-[3.4vw_1fr_22vw_8vw_13vw]">
            <Rank rank={e.rank} />
            <span className="truncate text-[1.7vw] font-bold">{e.name}</span>
            <span className="truncate text-[1.2vw]">{e.agency}</span>
            <span className="text-right text-[2.2vw] font-extrabold">{e.guests}</span>
            <span className="text-[1.1vw] font-semibold">
              {e.visits} lượt{e.lastCheckin ? `, ${formatDateTime(e.lastCheckin)}` : ""}
            </span>
          </RowShell>
        ))}
      </Rows>
    </>
  );
}

export function TvPrizesSlide({ summary, weeks }: { summary: Summary; weeks: WeekMeta[] }) {
  const { winners, meta } = summary;
  return (
    <>
      <Strip left="Giải các tuần" right={`Mốc tối thiểu ${meta.minGuestsPerWeek} khách mỗi tuần`} />
      <ul className="grid min-h-0 flex-1 grid-cols-4 gap-[1vw]" style={{ gridAutoRows: "1fr" }}>
        {weeks.map((w) => {
          const win = w.status === "upcoming" ? undefined : winners.find((x) => x.week === w.week);
          const label =
            w.status === "upcoming" ? "Chưa bắt đầu" : w.status === "ongoing" ? "Đang diễn ra" : win?.qualified ? "Đủ điều kiện" : "Chưa đủ";
          return (
            <li
              key={w.week}
              className={`row-in flex min-h-0 flex-col justify-between rounded-[1.2vw] px-[1.2vw] py-[1vh] text-white ${
                w.status === "ongoing" ? "bg-white/20 ring-[0.25vw] ring-orange-500" : "bg-white/10"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[1.6vw] font-extrabold text-orange-500">Tuần {w.week}</p>
                <p className="text-[1.05vw] font-semibold">{label}</p>
              </div>
              <p className="text-[1.05vw] text-purple-100">{formatWeekRange(w)}</p>
              {win ? (
                <div className="min-w-0">
                  <p className="truncate text-[1.5vw] font-bold">{win.name}</p>
                  <p className="truncate text-[1.05vw] text-purple-100">{win.agency} | {win.guests} khách</p>
                </div>
              ) : (
                <p className="text-[1.2vw] text-purple-100">{w.status === "upcoming" ? "-" : "Chưa có khách"}</p>
              )}
              <p className="text-[1.3vw] font-extrabold">
                {win?.qualified ? (
                  <span className="text-orange-500">{w.status === "ongoing" ? "Tạm tính " : ""}{formatVnd(win.prizeVnd)}</span>
                ) : w.status === "ended" ? (
                  <span className="text-purple-100">Không có giải</span>
                ) : (
                  ""
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
