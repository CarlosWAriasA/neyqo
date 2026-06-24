import { QueryClient } from '@tanstack/react-query';
import { financeQueryFreshness, financeQueryGcTime } from '../../features/finance/queryFreshness';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: financeQueryFreshness.default,
      gcTime: financeQueryGcTime,
      refetchOnWindowFocus: false,
    },
  },
});
