import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadFullBackup, downloadTransactionsCsv, importFullBackup } from '../../api/dataBackup';
import { financeQueryKeys } from './queryKeys';

export function useDownloadTransactionsCsv() {
  return useMutation({
    mutationFn: downloadTransactionsCsv,
  });
}

export function useDownloadFullBackup() {
  return useMutation({
    mutationFn: downloadFullBackup,
  });
}

export function useImportFullBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importFullBackup,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.categories }),
        queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['finance', 'scheduled-movements'] }),
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledUpcoming }),
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.scheduledSummary }),
        queryClient.invalidateQueries({ queryKey: financeQueryKeys.preferences }),
        queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] }),
      ]);
    },
  });
}
