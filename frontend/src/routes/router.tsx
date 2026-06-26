import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppRouteSkeleton } from '../layouts/AppRouteSkeleton';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthEntryRedirect } from './AuthEntryRedirect';

function PublicRouteFallback() {
  return <main className="min-h-screen bg-canvas text-text" aria-busy="true" />;
}

function AppRouteFallback() {
  const pathname = window.location.pathname;

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 text-text md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <AppRouteSkeleton pathname={pathname} />
      </div>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    HydrateFallback: PublicRouteFallback,
    children: [
      {
        index: true,
        lazy: async () => {
          const { LandingPage } = await import('../modules/landing/LandingPage');
          return { Component: LandingPage };
        },
      },
      {
        path: 'privacy',
        lazy: async () => {
          const { PrivacyPage } = await import('../modules/legal/PrivacyPage');
          return { Component: PrivacyPage };
        },
      },
      {
        path: 'terms',
        lazy: async () => {
          const { TermsPage } = await import('../modules/legal/TermsPage');
          return { Component: TermsPage };
        },
      },
      {
        path: 'auth/oauth/callback',
        lazy: async () => {
          const { OAuthCallbackPage } = await import('./OAuthCallbackPage');
          return { Component: OAuthCallbackPage };
        },
      },
    ],
  },
  {
    HydrateFallback: PublicRouteFallback,
    lazy: async () => {
      const { AuthLayout } = await import('../layouts/AuthLayout');
      return { Component: AuthLayout };
    },
    children: [
      { path: 'login', element: <AuthEntryRedirect mode="login" /> },
      { path: 'register', element: <AuthEntryRedirect mode="register" /> },
      { path: 'forgot-password', element: <AuthEntryRedirect mode="forgot-password" /> },
      {
        path: 'reset-password',
        lazy: async () => {
          const { ResetPasswordPage } = await import('../modules/auth/ResetPasswordPage');
          return { Component: ResetPasswordPage };
        },
      },
    ],
  },
  {
    path: 'app',
    HydrateFallback: AppRouteFallback,
    lazy: async () => {
      const { AppLayout } = await import('../layouts/AppLayout');
      return { Component: AppLayout };
    },
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      {
        lazy: async () => {
          const { AuthenticatedLayout } = await import('../layouts/AuthenticatedLayout');
          return { Component: AuthenticatedLayout };
        },
        children: [
          {
            path: 'dashboard',
            lazy: async () => {
              const { DashboardPage } = await import('../modules/dashboard/DashboardPage');
              return { Component: DashboardPage };
            },
          },
          {
            path: 'accounts',
            lazy: async () => {
              const { AccountsPage } = await import('../modules/accounts/AccountsPage');
              return { Component: AccountsPage };
            },
          },
          {
            path: 'transactions',
            lazy: async () => {
              const { TransactionsPage } = await import('../modules/transactions/TransactionsPage');
              return { Component: TransactionsPage };
            },
          },
          {
            path: 'categories',
            lazy: async () => {
              const { CategoriesPage } = await import('../modules/categories/CategoriesPage');
              return { Component: CategoriesPage };
            },
          },
          {
            path: 'budgets',
            lazy: async () => {
              const { BudgetsPage } = await import('../modules/budgets/BudgetsPage');
              return { Component: BudgetsPage };
            },
          },
          {
            path: 'scheduled',
            lazy: async () => {
              const { ScheduledPage } = await import('../modules/scheduled/ScheduledPage');
              return { Component: ScheduledPage };
            },
          },
          {
            path: 'sync',
            lazy: async () => {
              const { SyncPage } = await import('../modules/sync/SyncPage');
              return { Component: SyncPage };
            },
          },
          {
            path: 'reports',
            lazy: async () => {
              const { ReportsPage } = await import('../modules/reports/ReportsPage');
              return { Component: ReportsPage };
            },
          },
          {
            path: 'settings',
            lazy: async () => {
              const { SettingsPage } = await import('../modules/settings/SettingsPage');
              return { Component: SettingsPage };
            },
          },
          { path: '*', element: <Navigate to="/app/dashboard" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
