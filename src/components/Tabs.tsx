import type { TabId } from '../lib/params';

const TABS: { id: TabId; label: string }[] = [
  { id: 'week', label: 'Tuần này' },
  { id: 'overall', label: 'Tổng' },
  { id: 'prizes', label: 'Giải các tuần' },
];

export function Tabs({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Chọn bảng xếp hạng"
      className="flex gap-1 rounded-full bg-purple-100 p-1 w-fit"
    >
      {TABS.map((t) => {
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={on}
            aria-controls="tabpanel"
            onClick={() => onChange(t.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-semibold transition-colors md:flex-none md:px-6 md:text-sm ${
              on
                ? 'bg-purple-600 text-white'
                : 'text-purple-700 hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
