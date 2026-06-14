import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createTransaction,
  getAccounts,
  getBudget,
  getBudgets,
  getCategories,
  getGeneratedScheduledTransactions,
  getScheduledMovements,
  getScheduledSummary,
  getTransactions,
  getUpcomingScheduledMovements,
  type BudgetListParams,
  type ScheduledMovementListParams,
  type TransactionListParams,
} from '../../api/financial';
import { getUserPreferences } from '../../api/preferences';
import { financeQueryKeys } from './queryKeys';

export const defaultTransactionPageSize = 30;
export const defaultBudgetPageSize = 20;
export const defaultScheduledPageSize = 20;
export const defaultGeneratedPageSize = 30;

export function useAccounts() {
  return useQuery({ queryKey: financeQueryKeys.accounts, queryFn: getAccounts });
}

export function useCategories() {
  return useQuery({ queryKey: financeQueryKeys.categories, queryFn: getCategories });
}

export function usePreferences() {
  return useQuery({ queryKey: financeQueryKeys.preferences, queryFn: getUserPreferences });
}

export function useInfiniteTransactions(filters: Omit<TransactionListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.transactions(filters),
    queryFn: ({ pageParam }) =>
      getTransactions({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultTransactionPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  });
}

export function useInfiniteBudgets(filters: Omit<BudgetListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.budgets(filters),
    queryFn: ({ pageParam }) =>
      getBudgets({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultBudgetPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  });
}

export function useBudget(budgetId: string | undefined) {
  return useQuery({
    queryKey: budgetId ? financeQueryKeys.budget(budgetId) : ['finance', 'budget', 'idle'],
    queryFn: () => getBudget(budgetId!),
    enabled: Boolean(budgetId),
  });
}

export function useInfiniteScheduledMovements(filters: Omit<ScheduledMovementListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.scheduledMovements(filters),
    queryFn: ({ pageParam }) =>
      getScheduledMovements({ ...filters, cursor: pageParam || undefined, limit: filters.limit ?? defaultScheduledPageSize }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  });
}

export function useScheduledUpcoming() {
  return useQuery({ queryKey: financeQueryKeys.scheduledUpcoming, queryFn: getUpcomingScheduledMovements });
}

export function useScheduledSummary() {
  return useQuery({ queryKey: financeQueryKeys.scheduledSummary, queryFn: getScheduledSummary });
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
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledSummary }),
  ]);
}

export async function invalidateBudgets(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] });
}

export async function invalidateScheduled(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['finance', 'scheduled-movements'] }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledUpcoming }),
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledSummary }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'scheduled-generated'] }),
  ]);
}
