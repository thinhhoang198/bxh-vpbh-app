import { countdownTo, endOfDayMs, formatCountdown, formatNumber, formatVnd } from "../lib/format";
import type { Entry, WeekMeta } from "../lib/types";
import { CountUp } from "./CountUp";

type Props = {
  leader: Entry;
  week: WeekMeta;
  minGuests: number;
  prizeVnd: number;
  now: number;
};

export function HeroLeaderCard({ leader, week, minGuests, prizeVnd, now }: Props) {
  const qualified = leader.guests >= minGuests;
  const pct = Math.min(100, Math.round((leader.guests / minGuests) * 100));
  const cd = countdownTo(endOfDayMs(week.end), now);

  return (
    <section
      aria-label={`Dẫn đầu tuần ${week.week}`}
      className="noise relative overflow-hidden rounded-card bg-gradient-to-br from-purple-800 to-purple-700 p-5 text-white shadow-card md:p-7"
    >
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">DẪN ĐẦU TUẦN {week.week}</p>
          <h2 className="mt-1 break-words text-2xl font-extrabold leading-tight md:text-4xl">{leader.name}</h2>
          <p className="mt-1 text-sm text-purple-100 md:text-base">{leader.agency}</p>
        </div>
        <div className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0">
          <span className="text-5xl font-extrabold leading-none text-orange-500 md:text-6xl">
            <CountUp value={leader.guests} />
          </span>
          <span className="text-sm text-purple-100">khách</span>
        </div>
      </div>

      <div className="relative mt-5">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={minGuests}
          aria-valuenow={Math.min(leader.guests, minGuests)}
          aria-label="Tiến độ tới mốc đủ điều kiện nhận giải"
          className="h-3 overflow-hidden rounded-full bg-white/15"
        >
          <div className="h-full rounded-full bg-orange-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm font-medium text-white">
          {qualified
            ? `Đã đủ điều kiện nhận ${formatVnd(prizeVnd)}`
            : `${formatNumber(leader.guests)}/${minGuests} khách để đủ điều kiện nhận ${formatVnd(prizeVnd)}`}
        </p>
      </div>

      {week.status === "ongoing" && (
        <p className="relative mt-3 text-xs text-purple-100 md:text-sm">
          Còn {formatCountdown(cd)} đến 23:59 Chủ nhật ({week.end.split("-").reverse().slice(0, 2).join("/")})
        </p>
      )}
      {week.status === "ended" && <p className="relative mt-3 text-xs text-purple-100 md:text-sm">Tuần đã kết thúc, chờ BTC chốt giải.</p>}
    </section>
  );
}
