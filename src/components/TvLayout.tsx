import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UnauthorizedError } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { useSummary } from "../lib/queries";
import { useNow } from "../lib/useNow";
import { useProgram } from "../lib/useProgram";
import { AccessGate } from "./AccessGate";
import { Logo } from "./Logo";
import { NotStartedCard } from "./ProgramStates";
import { TvOverallSlide, TvPrizesSlide, TvWeekSlide } from "./TvSlides";

const SLIDE_MS = 20_000;
const TITLES = ["Tuần này | Top 10", "Bảng tổng | Top 10", "Giải các tuần"];

/** Full-screen display for the office TV: auto-rotating slides, no controls, no cursor. */
export default function TvLayout() {
  const summary = useSummary(); // refetches every 60s
  const queryClient = useQueryClient();
  const now = useNow();
  const { weeks, defaultWeek, notStarted } = useProgram(summary.data?.meta, now);
  const [idx, setIdx] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setIdx((i) => (i + 1) % TITLES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [idx, cycle]);

  // Remote/keyboard arrows jump between slides and restart the 20s timer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      setIdx((i) => (i + (e.key === "ArrowRight" ? 1 : TITLES.length - 1)) % TITLES.length);
      setCycle((c) => c + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep the TV awake where supported (no permission prompt; silently skipped otherwise).
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    const request = () => void navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, []);

  const meta = summary.data?.meta;
  let body;
  if (summary.error instanceof UnauthorizedError) {
    body = <div className="m-auto"><AccessGate onSubmit={() => void queryClient.invalidateQueries()} /></div>;
  } else if (!summary.data) {
    body = <p className="m-auto text-[2vw] text-white" role="status">{summary.isError ? "Không tải được dữ liệu. Đang thử lại…" : "Đang tải…"}</p>;
  } else if (notStarted) {
    body = <div className="m-auto w-[60vw] text-[1.6vw]"><NotStartedCard programStart={summary.data.meta.programStart} now={now} /></div>;
  } else if (idx === 0) {
    body = <TvWeekSlide summary={summary.data} weeks={weeks} selected={defaultWeek} now={now} />;
  } else if (idx === 1) {
    body = <TvOverallSlide summary={summary.data} />;
  } else {
    body = <TvPrizesSlide summary={summary.data} weeks={weeks} />;
  }

  return (
    <div className="noise relative flex h-screen w-screen cursor-none select-none flex-col overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white">
      <header className="relative flex items-center justify-between gap-[2vw] px-[2.5vw] pb-[1vh] pt-[2vh]">
        <div className="flex items-center gap-[2vw]">
          <Logo heightClass="h-[7vh]" />
          <div>
            <p className="text-[1.1vw] font-semibold tracking-[0.25em] text-orange-500">TỌA ĐỘ BỨT PHÁ</p>
            <h1 className="rose-gold-text text-[2.4vw] font-extrabold">Dẫn lối khách hàng - Chinh phục booking</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[1.8vw] font-bold">{TITLES[idx]}</p>
          {meta?.dataAsOf && <p className="text-[1.1vw] text-purple-100">Dữ liệu tính đến {formatDateTime(meta.dataAsOf)}</p>}
          {summary.isError && summary.data && <p className="text-[1.1vw] font-semibold text-orange-500">Mất kết nối, đang hiển thị dữ liệu cũ</p>}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col px-[2.5vw] pb-[1vh] pt-[0.5vh]">{body}</main>

      <footer className="relative px-[2.5vw] pb-[1.5vh]">
        <div className="mb-[0.8vh] h-[0.5vh] overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <div key={`${idx}-${cycle}`} className="tv-progress h-full rounded-full bg-orange-500" style={{ animationDuration: `${SLIDE_MS}ms` }} />
        </div>
        <div className="flex items-center justify-between text-[1vw] text-purple-100">
          <p>Bảng xếp hạng tạm tính. BTC đối soát và chốt giải vào cuối tuần.</p>
          <div className="flex gap-[0.5vw]" aria-hidden="true">
            {TITLES.map((_, i) => (
              <span key={i} className={`h-[0.8vw] w-[0.8vw] rounded-full ${i === idx ? "bg-orange-500" : "bg-white/30"}`} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
