import { CountUp } from "./CountUp";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-card md:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-grey-600">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-purple-600 md:text-4xl">
        <CountUp value={value} />
      </p>
    </div>
  );
}
