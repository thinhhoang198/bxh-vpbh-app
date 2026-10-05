import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSummary, fetchWeek, UnauthorizedError } from "./api";

const noRetryOn401 = (count: number, err: unknown) => !(err instanceof UnauthorizedError) && count < 2;

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false, // pauses while the tab is hidden
    staleTime: 30_000,
    retry: noRetryOn401,
    placeholderData: keepPreviousData,
  });
}

export function useWeek(week: number, enabled: boolean) {
  return useQuery({
    queryKey: ["week", week],
    queryFn: () => fetchWeek(week),
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    retry: noRetryOn401,
  });
}
