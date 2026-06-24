import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import {
  getGeneratedScheduledTransactions,
  getScheduledMovements,
  getScheduledSummary,
  getUpcomingScheduledMovements,
  type ScheduledMovementListParams,
} from '../../api/financial';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export const defaultScheduledPageSize = 20;
export const defaultGeneratedPageSize = 30;

export function useInfiniteScheduledMovements(filters: Omit<ScheduledMovementListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.scheduledMovements(filters),
    queryFn: ({ pageParam }) =>
      getScheduledMovements({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultScheduledPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useScheduledUpcoming() {
  return useQuery({
    queryKey: financeQueryKeys.scheduledUpcoming,
    queryFn: getUpcomingScheduledMovements,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useScheduledSummary() {
  return useQuery({
    queryKey: financeQueryKeys.scheduledSummary,
    queryFn: getScheduledSummary,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useInfiniteGeneratedScheduledTransactions(scheduledMovementId: string | undefined) {
  return useInfiniteQuery({
    queryKey: scheduledMovementId
      ? financeQueryKeys.scheduledGenerated(scheduledMovementId)
      : ['finance', 'scheduled-generated', 'idle'],
    queryFn: ({ pageParam }) =>
      getGeneratedScheduledTransactions(scheduledMovementId!, {
        cursor: pageParam || undefined,
        limit: defaultGeneratedPageSize,
      }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    enabled: Boolean(scheduledMovementId),
    staleTime: financeQueryFreshness.details,
  });
}

export async function invalidateScheduled(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['finance', 'scheduled-movements'] }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledUpcoming }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledSummary }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'scheduled-generated'] }),
  ]);
}
