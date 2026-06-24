import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../../api/financial';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export function useAccounts() {
  return useQuery({
    queryKey: financeQueryKeys.accounts,
    queryFn: getAccounts,
    staleTime: financeQueryFreshness.reference,
  });
}
