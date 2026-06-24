import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createEmailImportRule,
  getExternalConnections,
  getEmailImportRules,
  getImportedTransactions,
  startEmailSyncOAuth,
  updateEmailImportRule,
  updateImportedTransaction,
  type EmailImportRuleListParams,
  type EmailImportRulePayload,
  type ImportedTransactionListParams,
  type ImportedTransactionUpdatePayload,
} from '../../api/financial';
import type { ExternalConnection } from '../../types/financial';
import { financeQueryFreshness } from './queryFreshness';
import { financeQueryKeys } from './queryKeys';

export const defaultImportedTransactionPageSize = 30;

export function useExternalConnections() {
  return useQuery({
    queryKey: financeQueryKeys.externalConnections,
    queryFn: getExternalConnections,
    staleTime: financeQueryFreshness.reference,
  });
}

export function useEmailImportRules(filters: EmailImportRuleListParams = {}) {
  return useQuery({
    queryKey: financeQueryKeys.emailImportRules(filters),
    queryFn: () => getEmailImportRules(filters),
    staleTime: financeQueryFreshness.reference,
  });
}

export function useInfiniteImportedTransactions(filters: Omit<ImportedTransactionListParams, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: financeQueryKeys.importedTransactions(filters),
    queryFn: ({ pageParam }) =>
      getImportedTransactions({
        ...filters,
        cursor: pageParam || undefined,
        limit: filters.limit ?? defaultImportedTransactionPageSize,
      }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useCreateEmailImportRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmailImportRule,
    onSuccess: async () => {
      await invalidateEmailSyncData(queryClient);
    },
  });
}

export function useUpdateEmailImportRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ importRuleId, payload }: { importRuleId: string; payload: Partial<EmailImportRulePayload> & { status?: 'active' | 'inactive' } }) =>
      updateEmailImportRule(importRuleId, payload),
    onSuccess: async () => {
      await invalidateEmailSyncData(queryClient);
    },
  });
}

export function useUpdateImportedTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ importedTransactionId, payload }: { importedTransactionId: string; payload: ImportedTransactionUpdatePayload }) =>
      updateImportedTransaction(importedTransactionId, payload),
    onSuccess: async () => {
      await invalidateEmailSyncData(queryClient);
    },
  });
}

export function useStartEmailSyncOAuth() {
  return useMutation({
    mutationFn: ({ provider, returnTo }: { provider: ExternalConnection['provider']; returnTo: string }) =>
      startEmailSyncOAuth(provider, returnTo),
    onSuccess: (authUrl) => {
      window.location.assign(authUrl);
    },
  });
}

export async function invalidateEmailSyncData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.externalConnections }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'email-import-rules'] }),
    queryClient.invalidateQueries({ queryKey: ['finance', 'imported-transactions'] }),
  ]);
}
