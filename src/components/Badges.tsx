export function RankBadge({ rank }: { rank: number }) {
  const first = rank === 1;
  return (
    <span
      aria-label={`Hạng ${rank}`}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold ${
        first ? "bg-orange-500 text-purple-900" : "bg-purple-100 text-purple-700"
      }`}
    >
      {rank}
    </span>
  );
}

export function QualifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-orange-700/30 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
      <span aria-hidden="true">✓</span> Đủ điều kiện
    </span>
  );
}
