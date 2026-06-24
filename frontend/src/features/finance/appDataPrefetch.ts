import type { QueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  getBudgets,
  getCategories,
  getScheduledMovements,
  getScheduledSummary,
  getTransactions,
  getUpcomingScheduledMovements,
} from '../../api/financial';
import { getUserPreferences } from '../../api/preferences';
import {
  defaultBudgetPageSize,
  defaultScheduledPageSize,
  defaultTransactionPageSize,
} from './hooks';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export function prefetchAppData(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: financeQueryKeys.accounts,
      queryFn: getAccounts,
      staleTime: financeQueryFreshness.reference,
    }),
    queryClient.prefetchQuery({
      queryKey: financeQueryKeys.categories,
      queryFn: getCategories,
      staleTime: financeQueryFreshness.reference,
    }),
    queryClient.prefetchQuery({
      queryKey: financeQueryKeys.preferences,
      queryFn: getUserPreferences,
      staleTime: financeQueryFreshness.preferences,
    }),
    queryClient.prefetchQuery({
      queryKey: financeQueryKeys.scheduledSummary,
      queryFn: getScheduledSummary,
      staleTime: financeQueryFreshness.highActivity,
    }),
    queryClient.prefetchQuery({
      queryKey: financeQueryKeys.scheduledUpcoming,
      queryFn: getUpcomingScheduledMovements,
      staleTime: financeQueryFreshness.highActivity,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.transactions(),
      queryFn: ({ pageParam }) =>
        getTransactions({ cursor: String(pageParam || '') || undefined, limit: defaultTransactionPageSize }),
      initialPageParam: '',
      staleTime: financeQueryFreshness.highActivity,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.budgets({ status: 'active' }),
      queryFn: ({ pageParam }) =>
        getBudgets({ status: 'active', cursor: String(pageParam || '') || undefined, limit: defaultBudgetPageSize }),
      initialPageParam: '',
      staleTime: financeQueryFreshness.highActivity,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.scheduledMovements(),
      queryFn: ({ pageParam }) =>
        getScheduledMovements({ cursor: String(pageParam || '') || undefined, limit: defaultScheduledPageSize }),
      initialPageParam: '',
      staleTime: financeQueryFreshness.highActivity,
    }),
  ]);
}
