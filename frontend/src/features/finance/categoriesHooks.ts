import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/financial';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export function useCategories() {
  return useQuery({
    queryKey: financeQueryKeys.categories,
    queryFn: getCategories,
    staleTime: financeQueryFreshness.reference,
  });
}
