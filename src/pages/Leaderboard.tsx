import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AccessGate } from "../components/AccessGate";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import { Header } from "../components/Header";
import { OverallTab } from "../components/OverallTab";
import { PrizesTab } from "../components/PrizesTab";
import { EndedBanner, NotStartedCard } from "../components/ProgramStates";
import { RulesDialog } from "../components/RulesDialog";
import { ErrorState, LoadingState, StaleBanner } from "../components/States";
import { Tabs } from "../components/Tabs";
import { WeekTab } from "../components/WeekTab";
import { UnauthorizedError } from "../lib/api";
import { useViewParams } from "../lib/params";
import { useSummary } from "../lib/queries";
import { useNow } from "../lib/useNow";
import { useProgram } from "../lib/useProgram";

const TvLayout = lazy(() => import("../components/TvLayout"));

function Board() {
  const { tab, week, update } = useViewParams();
  const summary = useSummary();
  const queryClient = useQueryClient();
  const now = useNow();
  const meta = summary.data?.meta;

  const { weeks, defaultWeek, notStarted, ended } = useProgram(meta, now);

  const selected = week && week <= (meta?.totalWeeks ?? 0) ? week : defaultWeek;
  const unauthorized = summary.error instanceof UnauthorizedError;

  const tabs = <Tabs tab={tab} onChange={(t) => update({ tab: t === "week" ? null : t, agency: null })} />;

  let content;
  if (unauthorized) {
    content = <AccessGate onSubmit={() => void queryClient.invalidateQueries()} />;
  } else if (summary.isPending) {
    // Tabs render immediately so the page does not jump when data arrives.
    content = <div className="space-y-5">{tabs}<LoadingState /></div>;
  } else if (!summary.data) {
    content = <ErrorState onRetry={() => void summary.refetch()} />;
  } else if (notStarted) {
    content = <NotStartedCard programStart={summary.data.meta.programStart} now={now} />;
  } else {
    content = (
      <div className="space-y-5">
        {tabs}
        {ended && <EndedBanner />}
        {summary.isError && <StaleBanner updatedAt={summary.dataUpdatedAt} />}
        <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "week" && (
            <WeekTab
              summary={summary.data}
              weeks={weeks}
              selected={selected}
              onSelect={(w) => update({ week: String(w), agency: null })}
              now={now}
            />
          )}
          {tab === "overall" && <OverallTab summary={summary.data} />}
          {tab === "prizes" && <PrizesTab summary={summary.data} weeks={weeks} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header meta={meta} fetching={summary.isFetching} hasError={summary.isError && !unauthorized} />
      <DisclaimerBanner />
      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">{content}</main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-10 text-xs text-grey-600 md:px-6">
        <span>Nam Mekong Grand Plaza Bình Dương | Tọa độ bứt phá</span>
        <RulesDialog meta={meta} />
      </footer>
    </div>
  );
}

/** `?tv=1` switches to the full-screen office TV display. */
export default function Leaderboard() {
  const [sp] = useSearchParams();
  if (sp.get("tv") === "1") {
    return (
      <Suspense fallback={null}>
        <TvLayout />
      </Suspense>
    );
  }
  return <Board />;
}
