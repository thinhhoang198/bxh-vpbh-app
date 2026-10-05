type Props = {
  q: string;
  agency: string;
  agencies: string[];
  onQuery: (q: string) => void;
  onAgency: (a: string) => void;
};

const field =
  "w-full rounded-xl border border-purple-600/25 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-grey-600";

export function Toolbar({ q, agency, agencies, onQuery, onAgency }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-[1fr_16rem]" role="search">
      <label className="block">
        <span className="sr-only">Tìm theo tên hoặc đại lý</span>
        <input
          type="search"
          value={q}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc đại lý"
          autoComplete="off"
          className={field}
        />
      </label>
      <label className="block">
        <span className="sr-only">Lọc theo đại lý</span>
        <select value={agency} onChange={(e) => onAgency(e.target.value)} className={field}>
          <option value="">Tất cả đại lý</option>
          {agencies.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
