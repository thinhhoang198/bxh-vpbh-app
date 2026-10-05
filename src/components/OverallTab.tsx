import type { Summary } from "../lib/types";
import { Ranking } from "./Ranking";
import { StatCard } from "./StatCard";
import { EmptyState } from "./States";

export function OverallTab({ summary }: { summary: Summary }) {
  const { totals, overall, meta } = summary;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Tổng khách" value={totals.guests} />
        <StatCard label="Số CVKD có điểm" value={totals.cvkdCount} />
        <StatCard label="Số lượt check-in" value={totals.visits} />
      </div>
      {overall.length === 0 ? (
        <EmptyState message="Chưa có khách check-in. Hãy là người đầu tiên dẫn lối khách hàng!" />
      ) : (
        <Ranking entries={overall} variant="overall" minGuests={meta.minGuestsPerWeek} caption="Bảng xếp hạng tổng" />
      )}
    </div>
  );
}
