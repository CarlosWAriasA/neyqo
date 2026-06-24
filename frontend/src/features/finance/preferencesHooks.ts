import { useQuery } from '@tanstack/react-query';
import { getUserPreferences } from '../../api/preferences';
import { financeQueryKeys } from './queryKeys';
import { financeQueryFreshness } from './queryFreshness';

export function usePreferences() {
  return useQuery({
    queryKey: financeQueryKeys.preferences,
    queryFn: getUserPreferences,
    staleTime: financeQueryFreshness.preferences,
  });
}
