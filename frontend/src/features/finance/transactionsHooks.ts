import { useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createTransaction,
  getTransactions,
  type TransactionListParams,
} from '../../api/financial';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export const defaultTransactionPageSize = 30;

export function useInfiniteTransactions(filters: Omit<TransactionListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.transactions(filters),
    queryFn: ({ pageParam }) =>
      getTransactions({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultTransactionPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await invalidateFinanceAfterTransactionChange(queryClient);
    },
  });
}

export async function invalidateFinanceAfterTransactionChange(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.accounts }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledSummary }),
  ]);
}
