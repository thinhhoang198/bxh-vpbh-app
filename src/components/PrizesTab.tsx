import { formatNumber, formatVnd, formatWeekRange } from "../lib/format";
import type { Summary, WeekMeta, Winner } from "../lib/types";
import { QualifiedBadge } from "./Badges";

function StatusChip({ status, winner }: { status: WeekMeta["status"]; winner?: Winner }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (status === "upcoming") return <span className={`${base} border border-grey-600/40 text-grey-600`}>Chưa bắt đầu</span>;
  if (status === "ongoing") return <span className={`${base} bg-purple-100 text-purple-700`}>Đang diễn ra</span>;
  return winner?.qualified ? <QualifiedBadge /> : <span className={`${base} bg-purple-100 text-grey-600`}>Chưa đủ</span>;
}

function Prize({ status, winner }: { status: WeekMeta["status"]; winner?: Winner }) {
  if (status === "upcoming" || !winner) return <p className="text-sm text-grey-600">{status === "ended" ? "Không có giải" : "-"}</p>;
  if (winner.qualified) {
    return (
      <p className="text-sm font-extrabold text-orange-800">
        {status === "ongoing" ? "Tạm tính " : ""}
        {formatVnd(winner.prizeVnd)}
      </p>
    );
  }
  return <p className="text-sm text-grey-600">{status === "ended" ? "Không có giải tuần này" : "Chưa đủ điều kiện"}</p>;
}

type Props = { summary: Summary; weeks: WeekMeta[] };

export function PrizesTab({ summary, weeks }: Props) {
  const { winners, meta } = summary;
  return (
    <>
    <h2 className="sr-only">Giải các tuần</h2>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {weeks.map((w) => {
        const winner = w.status === "upcoming" ? undefined : winners.find((x) => x.week === w.week);
        return (
          <li
            key={w.week}
            className={`rounded-card bg-white p-4 shadow-card ${w.status === "ongoing" ? "ring-2 ring-orange-500" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-purple-600">Tuần {w.week}</h3>
                <p className="text-xs text-grey-600">{formatWeekRange(w)}</p>
              </div>
              <StatusChip status={w.status} winner={winner} />
            </div>
            <div className="mt-3 min-h-[3.5rem]">
              {winner ? (
                <>
                  <p className="break-words text-sm font-bold">{winner.name}</p>
                  <p className="text-xs text-grey-600">
                    {winner.agency} | {formatNumber(winner.guests)} khách
                  </p>
                </>
              ) : (
                <p className="text-sm text-grey-600">
                  {w.status === "upcoming" ? "Chưa có dữ liệu" : "Chưa có khách check-in"}
                </p>
              )}
            </div>
            <div className="mt-2 border-t border-purple-100 pt-2">
              <Prize status={w.status} winner={winner} />
              {w.status !== "upcoming" && (
                <p className="text-[11px] text-grey-600">Mốc tối thiểu {meta.minGuestsPerWeek} khách</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}
