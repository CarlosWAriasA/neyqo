import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import {
  getBudget,
  getBudgets,
  type BudgetListParams,
} from '../../api/financial';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export const defaultBudgetPageSize = 20;

export function useInfiniteBudgets(filters: Omit<BudgetListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.budgets(filters),
    queryFn: ({ pageParam }) =>
      getBudgets({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultBudgetPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useBudget(budgetId: string | undefined) {
  return useQuery({
    queryKey: budgetId ? financeQueryKeys.budget(budgetId) : ['finance', 'budget', 'idle'],
    queryFn: () => getBudget(budgetId!),
    enabled: Boolean(budgetId),
    staleTime: financeQueryFreshness.details,
  });
}

export async function invalidateBudgets(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] }),
  ]);
}
