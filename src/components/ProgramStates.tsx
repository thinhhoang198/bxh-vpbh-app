import { countdownTo, formatDate, startOfDayMs } from "../lib/format";

export function NotStartedCard({ programStart, now }: { programStart: string; now: number }) {
  const c = countdownTo(startOfDayMs(programStart), now);
  const tiles: [number, string][] = [
    [c.days, "ngày"],
    [c.hours, "giờ"],
    [c.minutes, "phút"],
  ];
  return (
    <section
      aria-label="Chương trình chưa bắt đầu"
      className="noise relative overflow-hidden rounded-card bg-gradient-to-br from-purple-800 to-purple-700 p-6 text-center text-white shadow-card md:p-10"
    >
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.2em] text-orange-500">CHƯƠNG TRÌNH CHƯA BẮT ĐẦU</p>
        <p className="mt-2 text-lg font-bold md:text-2xl">Khởi động ngày {formatDate(programStart)}</p>
        <div className="mt-5 flex justify-center gap-3">
          {tiles.map(([n, label]) => (
            <div key={label} className="w-20 rounded-xl bg-white/10 py-3 md:w-24">
              <p className="text-3xl font-extrabold text-orange-500 md:text-4xl">{n}</p>
              <p className="text-xs text-purple-100">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EndedBanner() {
  return (
    <div role="status" className="rounded-xl border border-purple-600/30 bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
      Chương trình đã kết thúc. Kết quả cuối cùng do BTC đối soát và công bố.
    </div>
  );
}
