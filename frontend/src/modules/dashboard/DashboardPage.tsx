import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createTransaction } from '../../api/financial';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import {
  invalidateFinanceAfterTransactionChange,
  useAccounts,
  useCategories,
  useInfiniteBudgets,
  useInfiniteTransactions,
  useScheduledUpcoming,
} from '../../features/finance/hooks';
import { flattenPages } from '../../features/finance/pagination';
import { AccountsOverviewCard } from './components/AccountsOverviewCard';
import { BudgetOverviewCard } from './components/BudgetOverviewCard';
import { DashboardStats } from './components/DashboardStats';
import { QuickTransactionPanel } from './components/QuickTransactionPanel';
import { RecentTransactionsCard } from './components/RecentTransactionsCard';
import { UpcomingScheduledCard } from './components/UpcomingScheduledCard';
import {
  emptyQuickTransactionValues,
  quickTransactionSchema,
  type QuickTransactionSubmitValues,
  type QuickTransactionValues,
} from './dashboard.schema';
import {
  buildBudgetSummary,
  buildDashboardSummary,
  toQuickTransactionPayload,
} from './dashboard.utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useInfiniteTransactions();
  const budgetsQuery = useInfiniteBudgets({ status: 'active' });
  const scheduledUpcomingQuery = useScheduledUpcoming();
  const quickForm = useForm<QuickTransactionValues, unknown, QuickTransactionSubmitValues>({
    resolver: zodResolver(quickTransactionSchema),
    defaultValues: emptyQuickTransactionValues,
  });

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions = flattenPages(transactionsQuery.data?.pages);
  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const quickType = quickForm.watch('type');
  const quickCategoryId = quickForm.watch('categoryId');
  const activeCategories = categories.filter((category) => category.status === 'active' && category.type === quickType);
  const latestTransactions = transactions.slice(0, 5);
  const activeBudgets = flattenPages(budgetsQuery.data?.pages).filter((budget) => budget.recordStatus === 'active');
  const warningBudgets = activeBudgets.filter((budget) => budget.status !== 'normal').slice(0, 3);
  const upcomingScheduled = scheduledUpcomingQuery.data?.slice(0, 4) ?? [];
  const dashboardSummary = useMemo(
    () => buildDashboardSummary(activeAccounts, transactions),
    [activeAccounts, transactions],
  );
  const budgetSummary = useMemo(() => buildBudgetSummary(activeBudgets), [activeBudgets]);
  const hasLoadError = accountsQuery.isError || transactionsQuery.isError || budgetsQuery.isError;
  const statsLoading = accountsQuery.isLoading || transactionsQuery.isLoading;
  const saveQuickTransactionMutation = useMutation({
    mutationFn: (values: QuickTransactionSubmitValues) => createTransaction(toQuickTransactionPayload(values)),
    onSuccess: async () => {
      toast.success('Movimiento registrado.');
      await invalidateFinanceAfterTransactionChange(queryClient);
      closeQuickPanel();
    },
    onError: () => {
      toast.error('No pudimos registrar el movimiento. Revisa los datos e intenta nuevamente.');
    },
  });

  function openQuickPanel(type: 'income' | 'expense' = 'expense') {
    quickForm.reset({ ...emptyQuickTransactionValues, type });
    setQuickPanelOpen(true);
  }

  function closeQuickPanel() {
    setQuickPanelOpen(false);
    quickForm.reset(emptyQuickTransactionValues);
  }

  return (
    <div className="grid gap-6 pb-8 lg:pb-10">
      <PageHeader
        eyebrow="Vista general"
        title="Tu dinero, sin ruido"
        description="Balance, flujo del mes, alertas de presupuesto y próximos movimientos en una sola vista."
        actions={
          <>
            <Button onClick={() => openQuickPanel('income')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar ingreso
            </Button>
            <Button variant="secondary" onClick={() => openQuickPanel('expense')}>
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              Registrar gasto
            </Button>
          </>
        }
      />

      {hasLoadError ? (
        <ErrorState
          title="No pudimos cargar todo el dashboard"
          description="Reintenta para actualizar balances, presupuestos y movimientos."
          onRetry={() => {
            void accountsQuery.refetch();
            void transactionsQuery.refetch();
            void budgetsQuery.refetch();
            void scheduledUpcomingQuery.refetch();
          }}
        />
      ) : null}

      <DashboardStats summary={dashboardSummary} activeAccountCount={activeAccounts.length} loading={statsLoading} />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <RecentTransactionsCard
          transactions={latestTransactions}
          loading={transactionsQuery.isLoading}
          onCreateTransaction={() => openQuickPanel('expense')}
        />
        <BudgetOverviewCard
          summary={budgetSummary}
          warningBudgets={warningBudgets}
          loading={budgetsQuery.isLoading}
          onOpenBudgets={() => navigate('/app/budgets')}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <AccountsOverviewCard
          accounts={activeAccounts}
          loading={accountsQuery.isLoading}
          onOpenAccounts={() => navigate('/app/accounts')}
        />
        <UpcomingScheduledCard
          movements={upcomingScheduled}
          loading={scheduledUpcomingQuery.isLoading}
          onOpenScheduled={() => navigate('/app/scheduled')}
        />
      </section>

      {quickPanelOpen ? (
        <QuickTransactionPanel
          form={quickForm}
          quickType={quickType}
          selectedCategoryId={quickCategoryId}
          activeAccounts={activeAccounts}
          activeCategories={activeCategories}
          saving={saveQuickTransactionMutation.isPending}
          onClose={closeQuickPanel}
          onSubmit={(values) => saveQuickTransactionMutation.mutate(values)}
        />
      ) : null}
    </div>
  );
}
