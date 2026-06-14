import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser, initializeUserData, refreshSession, restoreStoredUser } from '../api/auth';
import { authStorage } from '../api/client';
import { ErrorState } from '../components/feedback/ErrorState';
import { SessionExpired } from '../components/feedback/SessionExpired';
import { Skeleton } from '../components/common/Skeleton';
import { prefetchAppData } from '../features/finance/appDataPrefetch';
import { AppDataPrefetcher } from '../features/finance/AppDataPrefetcher';
import type { AuthUser } from '../types/auth';

let initializationToken: string | null = null;
let initializationPromise: Promise<AuthUser | null> | null = null;

function initializeDataOnce(accessToken: string | null): Promise<AuthUser | null> {
  if (!accessToken) {
    return Promise.resolve(null);
  }

  if (initializationToken === accessToken) {
    return Promise.resolve(null);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeUserData()
    .then((initializedUser) => {
      initializationToken = accessToken;
      return initializedUser;
    })
    .finally(() => {
      initializationPromise = null;
    });

  return initializationPromise;
}

export function AuthenticatedLayout() {
  const queryClient = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [status, setStatus] = useState<'loading' | 'initializing' | 'ready' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function validateSession() {
      try {
        let hasSession = false;
        let user: AuthUser | null = null;

        if (authStorage.getAccessToken()) {
          user = await getCurrentUser();
          hasSession = true;
        } else if (restoreStoredUser()) {
          user = await refreshSession();
          hasSession = true;
        } else {
          setSessionExpired(true);
          setRedirectToLogin(true);
        }

        if (!hasSession) {
          if (mounted) {
            setStatus('ready');
          }
          return;
        }

        const showInitialDataNotice = user ? !user.initialDataNoticeShown : false;

        if (mounted && showInitialDataNotice) {
          setStatus('initializing');
        }

        const accessToken = authStorage.getAccessToken();
        const loadingToastId = 'neyqo-initial-data';
        let toastShown = false;
        const toastTimer = showInitialDataNotice
          ? window.setTimeout(() => {
              toast.loading('Preparando tus datos iniciales...', {
                id: loadingToastId,
              });
              toastShown = true;
            }, 500)
          : undefined;

        try {
          const initializedUser = await initializeDataOnce(accessToken);
          user = initializedUser ?? user;

          if (toastTimer !== undefined) {
            window.clearTimeout(toastTimer);
          }

          if (toastShown) {
            toast.success('Datos iniciales listos.', {
              id: loadingToastId,
            });
          }
        } catch {
          if (toastTimer !== undefined) {
            window.clearTimeout(toastTimer);
          }

          if (toastShown) {
            toast.error('No pudimos preparar tus datos iniciales.', {
              id: loadingToastId,
            });
          }
        }

        await prefetchAppData(queryClient);

        if (mounted) {
          setCurrentUser(user);
          setStatus('ready');
        }
      } catch {
        if (mounted) {
          setSessionExpired(true);
          setRedirectToLogin(true);
          setCurrentUser(null);
          setStatus('ready');
        }
      }
    }

    validateSession();

    const handleExpired = () => setSessionExpired(true);
    window.addEventListener('neyqo:session-expired', handleExpired);

    return () => {
      mounted = false;
      window.removeEventListener('neyqo:session-expired', handleExpired);
    };
  }, [queryClient]);

  if (status === 'loading' || status === 'initializing') {
    return (
      <div className="grid gap-6 lg:h-full lg:min-h-0">
        <Skeleton className="h-28" />
        {status === 'initializing' ? (
          <div className="rounded-panel border border-border bg-surface p-4 text-sm text-subtle shadow-soft">
            Preparando tus cuentas, categorías y programados iniciales...
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState />;
  }

  if (redirectToLogin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className={
        sessionExpired
          ? 'grid gap-6 lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]'
          : 'grid gap-6 lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]'
      }
    >
      {currentUser ? <AppDataPrefetcher userId={currentUser.id} /> : null}
      {sessionExpired ? <SessionExpired /> : null}
      <div className="lg:min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
