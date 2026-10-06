import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatVnd,
} from '../lib/format';
import type { Summary } from '../lib/types';
import { Logo } from './Logo';

type Props = {
  meta?: Summary['meta'];
  fetching: boolean;
  hasError: boolean;
};

const NBSP = ' '; // keeps the row height before data arrives (no layout shift)

/** Concentric arches taken from the gateway shape of the logo mark; outline only, very low contrast. */
function Arches() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 260"
      preserveAspectRatio="xMaxYMax slice"
      className="pointer-events-none absolute bottom-0 right-0 hidden h-full max-h-[260px] w-[360px] md:block"
      fill="none"
      stroke="#fff"
      strokeOpacity="0.16"
      strokeWidth="1.5"
    >
      <rect x="120" y="24" width="210" height="400" rx="105" />
      <rect x="152" y="56" width="146" height="400" rx="73" />
      <rect x="184" y="88" width="82" height="400" rx="41" />
    </svg>
  );
}

export function Header({ meta, fetching, hasError }: Props) {
  const status = hasError
    ? 'Mất kết nối, sẽ thử lại'
    : fetching
      ? 'Đang làm mới…'
      : 'Tự làm mới mỗi 60 giây';
  const dot = hasError || fetching ? 'bg-orange-500' : 'bg-purple-600';

  const facts: [string, string][] = [
    [
      'Thời gian',
      meta
        ? `${formatDate(meta.programStart)} đến ${formatDate(meta.programEnd)}`
        : NBSP,
    ],
    ['Số tuần', meta ? `${formatNumber(meta.totalWeeks)} tuần` : NBSP],
    ['Giải mỗi tuần', meta ? `${formatVnd(meta.weeklyPrizeVnd)}` : NBSP],
  ];

  return (
    <header>
      {/* Light bar: colour logo top-left, data freshness on the right */}
      <div className="border-b border-purple-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Logo onDark={false} heightClass="h-12 md:h-16" />
          <div
            className="text-right text-xs leading-snug md:text-sm"
            aria-live="polite"
          >
            <p className="font-semibold text-ink">
              {meta?.dataAsOf
                ? `Dữ liệu tính đến ${formatDateTime(meta.dataAsOf)}`
                : NBSP}
            </p>
            <p className="mt-0.5 flex items-center justify-end gap-1.5 text-grey-600">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${dot}`}
              />
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* Brand purple band: flat, no gradients */}
      <div className="relative overflow-hidden bg-purple-600 text-white">
        <Arches />
        <div className="relative mx-auto max-w-6xl px-4 pb-5 pt-7 md:px-6 md:pb-7 md:pt-10">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-purple-100 md:text-sm">
            <span aria-hidden="true" className="h-[3px] w-8 bg-orange-500" />
            TỌA ĐỘ BỨT PHÁ
          </p>
          <h1 className="mt-3 text-[1.65rem] font-extrabold leading-tight tracking-tight md:text-[2.5rem] lg:text-5xl">
            Dẫn lối khách hàng - Chinh phục booking
          </h1>
          <dl className="mt-6 grid border-t border-white/25 sm:grid-cols-[auto_auto_1fr] md:mt-8">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-white/15 py-2.5 sm:block sm:border-b-0 sm:border-l sm:border-white/25 sm:px-6 sm:py-3.5 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-purple-100">
                  {label}
                </dt>
                <dd className="text-sm font-semibold sm:mt-0.5 md:text-base">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
