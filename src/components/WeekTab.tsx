import { useWeek } from "../lib/queries";
import type { Summary, WeekMeta } from "../lib/types";
import { HeroLeaderCard } from "./HeroLeaderCard";
import { Ranking } from "./Ranking";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { WeekSelector } from "./WeekSelector";

type Props = {
  summary: Summary;
  weeks: WeekMeta[]; // statuses already evaluated against "now"
  selected: number;
  onSelect: (week: number) => void;
  now: number;
};

export function WeekTab({ summary, weeks, selected, onSelect, now }: Props) {
  const { meta } = summary;
  const week = weeks.find((w) => w.week === selected) ?? weeks[0];
  const fromSummary = week.week === meta.currentWeek;
  const q = useWeek(week.week, !fromSummary && week.status !== "upcoming");
  const entries = fromSummary ? summary.currentWeekEntries : (q.data?.entries ?? []);

  let body;
  if (week.status === "upcoming") {
    body = <EmptyState message={`Tuần ${week.week} chưa bắt đầu.`} />;
  } else if (!fromSummary && q.isPending) {
    body = <LoadingState />;
  } else if (!fromSummary && q.isError && !q.data) {
    body = <ErrorState onRetry={() => void q.refetch()} />;
  } else if (entries.length === 0) {
    body = <EmptyState message="Chưa có khách check-in trong tuần này. Hãy là người đầu tiên dẫn lối khách hàng!" />;
  } else {
    body = (
      <Ranking
        key={week.week}
        entries={entries}
        variant="week"
        minGuests={meta.minGuestsPerWeek}
        caption={`Bảng xếp hạng tuần ${week.week}`}
        lead={
          <HeroLeaderCard
            leader={entries[0]}
            week={week}
            minGuests={meta.minGuestsPerWeek}
            prizeVnd={meta.weeklyPrizeVnd}
            now={now}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <WeekSelector weeks={weeks} selected={week.week} onSelect={onSelect} />
      {body}
    </div>
  );
}
