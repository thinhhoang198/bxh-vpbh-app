import type { Entry } from "../lib/types";

// Arched column tops echo the gateway shape of the logo mark. No gold/silver/bronze.
const SLOT = [
  { idx: 1, height: "h-44 md:h-52", tone: "bg-purple-100 text-purple-900" }, // 2nd, left
  { idx: 0, height: "h-52 md:h-64", tone: "bg-orange-500 text-purple-900" }, // 1st, center
  { idx: 2, height: "h-40 md:h-44", tone: "bg-purple-100 text-purple-900" }, // 3rd, right
];

export function Podium({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol aria-label="Top 3" className="mx-auto grid max-w-2xl grid-cols-3 items-end gap-2 md:gap-4">
      {SLOT.map(({ idx, height, tone }) => {
        const e = entries[idx];
        if (!e) return <li key={idx} aria-hidden="true" />;
        return (
          <li
            key={idx}
            className={`row-in flex flex-col items-center justify-start rounded-t-[999px] px-2 pb-3 pt-6 text-center md:px-4 md:pt-8 ${height} ${tone}`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <span className="text-3xl font-extrabold leading-none md:text-4xl">{e.rank}</span>
            <span className="mt-2 line-clamp-2 break-words text-xs font-bold leading-snug md:text-base">{e.name}</span>
            <span className="mt-0.5 line-clamp-1 text-[11px] md:text-xs">{e.agency}</span>
            <span className="mt-auto text-sm font-extrabold md:text-lg">{e.guests} khách</span>
          </li>
        );
      })}
    </ol>
  );
}
