import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, type RouterProviderProps } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { queryClient } from './queryClient';

interface AppProvidersProps {
  router: RouterProviderProps['router'];
}

export function AppProviders({ router }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster closeButton richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
