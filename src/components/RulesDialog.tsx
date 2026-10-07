import { useRef } from 'react';
import { endOfDayMs, formatDate, formatVnd, startOfDayMs } from '../lib/format';
import type { Summary } from '../lib/types';

/** A normal week is exactly 7 days (Monday to Sunday). */
const isRegularWeek = (w: { start: string; end: string }) =>
  Math.round((endOfDayMs(w.end) - startOfDayMs(w.start)) / 86_400_000) === 7;

export function RulesDialog({ meta }: { meta?: Summary['meta'] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const w1 = meta?.weeks[0];

  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        className="rounded-full border border-purple-600 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-100"
      >
        Thể lệ rút gọn
      </button>
      <dialog
        ref={ref}
        aria-labelledby="rules-title"
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto w-[min(92vw,34rem)] rounded-card p-0 text-ink shadow-card backdrop:bg-purple-900/60"
      >
        <div className="p-6">
          <h2
            id="rules-title"
            className="text-xl font-extrabold text-purple-600"
          >
            Thể lệ rút gọn
          </h2>
          <p className="text-sm text-grey-600">
            Dẫn lối khách hàng - Chinh phục booking
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              <b>Thời gian:</b>{' '}
              {meta
                ? `${formatDate(meta.programStart)} đến ${formatDate(meta.programEnd)}, gồm ${meta.totalWeeks} tuần.`
                : 'Xem thông tin trên bảng xếp hạng.'}{' '}
              {w1 && isRegularWeek(w1)
                ? 'Mỗi tuần tính từ Thứ Hai đến Chủ nhật.'
                : w1 &&
                  `Tuần 1 kéo dài từ ${formatDate(w1.start)} đến ${formatDate(w1.end)}; từ tuần 2 mỗi tuần tính từ Thứ Hai đến Chủ nhật.`}
            </li>
            <li>
              <b>Điểm:</b> tổng số khách thực tế được lễ tân xác nhận khi
              check-in tại VPBH. 1 khách = 1 điểm.
            </li>
            <li>
              <b>Giải tuần:</b> CVKD có số khách cao nhất tuần và đạt tối thiểu{' '}
              {meta?.minGuestsPerWeek ?? 5} khách nhận{' '}
              {formatVnd(meta?.weeklyPrizeVnd ?? 1_000_000)}. Tuần nào không ai
              đạt mốc này thì không có giải.
            </li>
            <li>
              <b>Đồng điểm:</b> ai đạt số khách đó sớm hơn xếp trên.
            </li>
            <li>
              <b>Tạm tính:</b> bảng xếp hạng chỉ mang tính tạm tính. BTC đối
              soát và chốt giải vào cuối tuần.
            </li>
          </ul>
          <div className="mt-4 rounded-xl bg-purple-50 p-3 text-sm">
            <p className="font-semibold">Liên hệ BTC</p>
            {/* TODO: fill in real contact details */}
            <p className="text-grey-600">Thịnh | 0705030017</p>
          </div>
          <button
            onClick={() => ref.current?.close()}
            className="mt-5 w-full rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Đóng
          </button>
        </div>
      </dialog>
    </>
  );
}
