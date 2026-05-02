import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNudge(userId: string = "user-passive-1", mockHour?: number, mockMinute?: number) {
  const params = new URLSearchParams();
  params.set("userId", userId);
  if (mockHour !== undefined) params.set("mockHour", mockHour.toString());
  if (mockMinute !== undefined) params.set("mockMinute", mockMinute.toString());

  const { data, error, isLoading, mutate } = useSWR<{ message: string | null; isAppropriateTime: boolean }>(
    `/api/nudge?${params.toString()}`,
    fetcher
  );

  return {
    nudgeMessage: data?.message,
    isAppropriateTime: data?.isAppropriateTime ?? true,
    isLoading,
    isError: error,
    mutate,
  };
}
