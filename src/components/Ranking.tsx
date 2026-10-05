import { useMemo, type ReactNode } from "react";
import { usePinned } from "../lib/pinned";
import { useViewParams } from "../lib/params";
import { entryKey, filterByAgency, listAgencies, matchesQuery } from "../lib/search";
import type { Entry } from "../lib/types";
import { RankBadge } from "./Badges";
import { Podium } from "./Podium";
import { RankTable, type Variant } from "./RankTable";
import { EmptyState } from "./States";
import { Toolbar } from "./Toolbar";

type Props = {
  entries: Entry[];
  variant: Variant;
  minGuests: number;
  caption: string;
  /** Shown above the podium when no search or filter is active. */
  lead?: ReactNode;
};

/** Search, agency filter, pin, podium and table. Never re-sorts: rows keep the source order. */
export function Ranking({ entries, variant, minGuests, caption, lead }: Props) {
  const { q, agency, update } = useViewParams();
  const pin = usePinned();
  const agencies = useMemo(() => listAgencies(entries), [entries]);
  const searching = q.trim() !== "";
  const filtering = searching || agency !== "";

  const rows = useMemo(() => {
    const byAgency = filterByAgency(entries, agency);
    return searching ? byAgency.filter((e) => matchesQuery(e, q)) : byAgency;
  }, [entries, agency, q, searching]);

  const mine = pin.key ? entries.find((e) => entryKey(e) === pin.key) : undefined;

  return (
    <div className="space-y-5">
      <Toolbar
        q={q}
        agency={agency}
        agencies={agencies}
        onQuery={(v) => update({ q: v })}
        onAgency={(v) => update({ agency: v })}
      />

      {pin.key && (
        <section aria-label="Của tôi" className="flex items-center gap-3 rounded-card border border-purple-600/30 bg-purple-100 p-3">
          {mine ? (
            <>
              <RankBadge rank={mine.rank} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-purple-700">Của tôi</p>
                <p className="break-words text-sm font-bold">{mine.name}</p>
                <p className="truncate text-xs text-grey-600">{mine.agency}</p>
              </div>
              <p className="text-xl font-extrabold">{mine.guests} <span className="text-xs font-medium text-grey-600">khách</span></p>
            </>
          ) : (
            <p className="flex-1 text-sm text-grey-600">Người bạn ghim chưa có điểm trong bảng này.</p>
          )}
          <button onClick={() => pin.toggle(pin.key)} className="rounded-full border border-purple-600/40 px-3 py-1 text-xs font-semibold text-purple-700">
            Bỏ ghim
          </button>
        </section>
      )}

      {filtering ? (
        <>
          <p aria-live="polite" className="text-sm font-medium text-grey-600">{rows.length} kết quả</p>
          {rows.length === 0 ? (
            <EmptyState message="Không tìm thấy kết quả phù hợp." />
          ) : (
            <RankTable
              entries={rows}
              variant={variant}
              minGuests={minGuests}
              caption={caption}
              pinnedKey={pin.key}
              onTogglePin={pin.toggle}
              highlight={searching}
            />
          )}
        </>
      ) : (
        <>
          {lead}
          <Podium entries={entries.slice(0, 3)} />
          <RankTable
            entries={entries.slice(3)}
            variant={variant}
            minGuests={minGuests}
            caption={`${caption}, từ vị trí thứ 4`}
            pinnedKey={pin.key}
            onTogglePin={pin.toggle}
          />
        </>
      )}
    </div>
  );
}
