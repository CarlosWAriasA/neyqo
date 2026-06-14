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

export function prefetchAppData(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: financeQueryKeys.accounts, queryFn: getAccounts }),
    queryClient.prefetchQuery({ queryKey: financeQueryKeys.categories, queryFn: getCategories }),
    queryClient.prefetchQuery({ queryKey: financeQueryKeys.preferences, queryFn: getUserPreferences }),
    queryClient.prefetchQuery({ queryKey: financeQueryKeys.scheduledSummary, queryFn: getScheduledSummary }),
    queryClient.prefetchQuery({ queryKey: financeQueryKeys.scheduledUpcoming, queryFn: getUpcomingScheduledMovements }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.transactions(),
      queryFn: ({ pageParam }) =>
        getTransactions({ cursor: String(pageParam || '') || undefined, limit: defaultTransactionPageSize }),
      initialPageParam: '',
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.budgets(),
      queryFn: ({ pageParam }) =>
        getBudgets({ cursor: String(pageParam || '') || undefined, limit: defaultBudgetPageSize }),
      initialPageParam: '',
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: financeQueryKeys.scheduledMovements(),
      queryFn: ({ pageParam }) =>
        getScheduledMovements({ cursor: String(pageParam || '') || undefined, limit: defaultScheduledPageSize }),
      initialPageParam: '',
    }),
  ]);
}
