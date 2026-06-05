import { createBrowserRouter, Navigate } from 'react-router-dom';
import { OAuthCallbackPage } from './OAuthCallbackPage';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AccountsPage } from '../modules/accounts/AccountsPage';
import { ResetPasswordPage } from '../modules/auth/ResetPasswordPage';
import { BudgetsPage } from '../modules/budgets/BudgetsPage';
import { CategoriesPage } from '../modules/categories/CategoriesPage';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { LandingPage } from '../modules/landing/LandingPage';
import { PrivacyPage } from '../modules/legal/PrivacyPage';
import { TermsPage } from '../modules/legal/TermsPage';
import { ReportsPage } from '../modules/reports/ReportsPage';
import { ScheduledPage } from '../modules/scheduled/ScheduledPage';
import { SettingsPage } from '../modules/settings/SettingsPage';
import { SyncPage } from '../modules/sync/SyncPage';
import { TransactionsPage } from '../modules/transactions/TransactionsPage';
import { AuthEntryRedirect } from './AuthEntryRedirect';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'auth/oauth/callback', element: <OAuthCallbackPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <AuthEntryRedirect mode="login" /> },
      { path: 'register', element: <AuthEntryRedirect mode="register" /> },
      { path: 'forgot-password', element: <AuthEntryRedirect mode="forgot-password" /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: 'app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'scheduled', element: <ScheduledPage /> },
          { path: 'sync', element: <SyncPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <Navigate to="/app/dashboard" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
