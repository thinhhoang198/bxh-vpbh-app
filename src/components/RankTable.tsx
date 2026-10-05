import { formatDateTime } from "../lib/format";
import { entryKey } from "../lib/search";
import { useMediaQuery } from "../lib/useMediaQuery";
import type { Entry } from "../lib/types";
import { QualifiedBadge, RankBadge } from "./Badges";

export type Variant = "week" | "overall";

type Props = {
  entries: Entry[];
  variant: Variant;
  minGuests: number;
  caption: string;
  pinnedKey: string;
  onTogglePin: (key: string) => void;
  /** Mark rows as search matches. */
  highlight?: boolean;
};

function PinButton({ pinned, onClick }: { pinned: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pinned}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
        pinned ? "border-purple-600 bg-purple-600 text-white" : "border-purple-600/40 text-purple-700 hover:bg-purple-100"
      }`}
    >
      {pinned ? "Đã ghim" : "Ghim tôi"}
    </button>
  );
}

function rowTone(i: number, pinned: boolean, highlight: boolean) {
  if (pinned) return "bg-purple-100";
  if (highlight) return "bg-orange-50 shadow-[inset_4px_0_0_#F79421]";
  return i % 2 ? "bg-purple-50" : "bg-white";
}

export function RankTable({ entries, variant, minGuests, caption, pinnedKey, onTogglePin, highlight = false }: Props) {
  // Render only the layout that is visible: halves the DOM for long lists.
  const desktop = useMediaQuery("(min-width: 768px)");
  if (entries.length === 0) return null;
  const overall = variant === "overall";
  const th = "sticky top-0 z-10 bg-purple-600 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white";
  const delay = (i: number) => ({ animationDelay: `${Math.min(i, 30) * 20}ms` });

  return desktop ? (
      <table className="w-full border-separate border-spacing-0 rounded-card bg-white shadow-card">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${th} rounded-tl-card`}>Hạng</th>
            <th scope="col" className={th}>CVKD</th>
            <th scope="col" className={th}>Đại lý</th>
            <th scope="col" className={`${th} text-right`}>{overall ? "Tổng khách" : "Khách"}</th>
            {overall && <th scope="col" className={`${th} text-right`}>Số lượt</th>}
            {overall && <th scope="col" className={`${th} text-right`}>Check-in gần nhất</th>}
            {!overall && <th scope="col" className={th}><span className="sr-only">Điều kiện</span></th>}
            <th scope="col" className={`${th} rounded-tr-card`}><span className="sr-only">Ghim</span></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const k = entryKey(e);
            const pinned = k === pinnedKey;
            return (
              <tr key={`${k}-${i}`} className={`row-in ${rowTone(i, pinned, highlight)}`} style={delay(i)}>
                <td className="px-4 py-3"><RankBadge rank={e.rank} /></td>
                <td className="px-4 py-3 font-semibold">{e.name}</td>
                <td className="px-4 py-3 text-grey-600">{e.agency}</td>
                <td className="px-4 py-3 text-right text-lg font-bold">{e.guests}</td>
                {overall && <td className="px-4 py-3 text-right">{e.visits ?? ""}</td>}
                {overall && (
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-grey-600">
                    {e.lastCheckin ? formatDateTime(e.lastCheckin) : ""}
                  </td>
                )}
                {!overall && <td className="px-4 py-3">{e.guests >= minGuests && <QualifiedBadge />}</td>}
                <td className="px-4 py-3 text-right"><PinButton pinned={pinned} onClick={() => onTogglePin(k)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
  ) : (
      <ul className="space-y-2" aria-label={caption}>
        {entries.map((e, i) => {
          const k = entryKey(e);
          const pinned = k === pinnedKey;
          return (
            <li
              key={`${k}-${i}`}
              className={`row-in flex items-center gap-3 rounded-card p-3 shadow-card ${rowTone(0, pinned, highlight)}`}
              style={delay(i)}
            >
              <RankBadge rank={e.rank} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold leading-snug">{e.name}</p>
                <p className="truncate text-xs text-grey-600">{e.agency}</p>
                {overall && e.lastCheckin && (
                  <p className="text-[11px] text-grey-600">
                    {e.visits} lượt, gần nhất {formatDateTime(e.lastCheckin)}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {!overall && e.guests >= minGuests && <QualifiedBadge />}
                  <PinButton pinned={pinned} onClick={() => onTogglePin(k)} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold leading-none">{e.guests}</p>
                <p className="text-[11px] text-grey-600">khách</p>
              </div>
            </li>
          );
        })}
      </ul>
  );
}
