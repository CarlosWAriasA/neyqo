import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, refreshSession, restoreStoredUser } from '../api/auth';
import { authStorage } from '../api/client';
import { ErrorState } from '../components/feedback/ErrorState';
import { SessionExpired } from '../components/feedback/SessionExpired';
import { Skeleton } from '../components/common/Skeleton';

export function AuthenticatedLayout() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    async function validateSession() {
      try {
        if (authStorage.getAccessToken()) {
          await getCurrentUser();
        } else if (restoreStoredUser()) {
          await refreshSession();
        } else {
          setSessionExpired(true);
          setRedirectToLogin(true);
        }

        if (mounted) {
          setStatus('ready');
        }
      } catch {
        if (mounted) {
          setSessionExpired(true);
          setRedirectToLogin(true);
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
  }, []);

  if (status === 'loading') {
    return (
      <div className="grid gap-6 lg:h-full lg:min-h-0">
        <Skeleton className="h-28" />
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
      {sessionExpired ? <SessionExpired /> : null}
      <div className="lg:min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
