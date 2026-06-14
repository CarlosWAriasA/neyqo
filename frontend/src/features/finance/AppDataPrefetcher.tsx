import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchAppData } from './appDataPrefetch';

interface AppDataPrefetcherProps {
  userId: string;
}

export function AppDataPrefetcher({ userId }: AppDataPrefetcherProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    void prefetchAppData(queryClient);
  }, [queryClient, userId]);

  return null;
}
