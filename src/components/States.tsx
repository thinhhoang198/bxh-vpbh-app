import { formatTime } from "../lib/format";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-purple-100 ${className}`} aria-hidden="true" />;
}

export function LoadingState() {
  return (
    <div role="status" aria-label="Đang tải dữ liệu" className="space-y-4">
      <Skeleton className="h-16" />
      <Skeleton className="h-72" />
      <Skeleton className="h-52" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card bg-white p-8 text-center text-grey-600 shadow-card">
      <p className="mx-auto max-w-md text-base font-medium">{message}</p>
    </div>
  );
}

export function StaleBanner({ updatedAt }: { updatedAt: number }) {
  return (
    <div role="alert" className="rounded-xl border border-orange-700/30 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800">
      Không thể làm mới. Đang hiển thị dữ liệu lúc {formatTime(new Date(updatedAt).toISOString())}.
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-card bg-white p-8 text-center shadow-card">
      <p className="font-semibold text-ink">Không tải được bảng xếp hạng.</p>
      <p className="mt-1 text-sm text-grey-600">Vui lòng kiểm tra kết nối mạng rồi thử lại.</p>
      <button onClick={onRetry} className="mt-4 rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white">
        Thử lại
      </button>
    </div>
  );
}
