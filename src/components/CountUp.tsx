import { formatNumber } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";

export function CountUp({ value }: { value: number }) {
  return <>{formatNumber(useCountUp(value))}</>;
}
