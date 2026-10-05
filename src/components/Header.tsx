import { formatDate, formatDateTime } from "../lib/format";
import type { Summary } from "../lib/types";
import { Logo } from "./Logo";

type Props = {
  meta?: Summary["meta"];
  fetching: boolean;
  hasError: boolean;
};

export function Header({ meta, fetching, hasError }: Props) {
  return (
    <header className="noise relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white">
      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-5 md:px-6 md:pb-10">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <div className="text-right text-xs leading-relaxed text-purple-100 md:text-sm" aria-live="polite">
            {meta?.dataAsOf && <p>Dữ liệu tính đến {formatDateTime(meta.dataAsOf)}</p>}
            <p className="text-purple-100/80">
              {hasError ? "Mất kết nối, sẽ thử lại" : fetching ? "Đang làm mới…" : "Tự làm mới mỗi 60 giây"}
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs font-semibold tracking-[0.25em] text-orange-500 md:text-sm">TỌA ĐỘ BỨT PHÁ</p>
        <h1 className="rose-gold-text mt-1 text-3xl font-extrabold md:text-5xl">Dẫn lối khách hàng - Chinh phục booking</h1>
        <p className="mt-2 min-h-10 text-sm text-purple-100 md:min-h-6 md:text-base">
          {meta ? `${formatDate(meta.programStart)} đến ${formatDate(meta.programEnd)} | ${meta.totalWeeks} tuần` : ""}
        </p>
      </div>
    </header>
  );
}
