import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Landmark,
  ListChecks,
  Plus,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getTransactions,
  getUpcomingScheduledMovements,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Field } from '../../components/forms/Field';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { accountTypeIcons, accountTypeLabels } from '../../config/navigation';
import type { Account, Transaction } from '../../types/financial';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';

const quickTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  sourceAccountId: z.string().min(1, 'Selecciona una cuenta.'),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  description: z.string().trim().min(2, 'Agrega una descripción.').max(140),
  date: z.string().min(1, 'Selecciona una fecha.'),
  note: z.string().trim().max(500).optional(),
});

type QuickTransactionValues = z.input<typeof quickTransactionSchema>;
type QuickTransactionSubmitValues = z.output<typeof quickTransactionSchema>;

const emptyQuickTransactionValues: QuickTransactionValues = {
  type: 'expense',
  amount: 0,
  sourceAccountId: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const scheduledUpcomingQuery = useQuery({ queryKey: ['scheduled-upcoming'], queryFn: getUpcomingScheduledMovements });
  const quickForm = useForm<QuickTransactionValues, unknown, QuickTransactionSubmitValues>({
    resolver: zodResolver(quickTransactionSchema),
    defaultValues: emptyQuickTransactionValues,
  });

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const activeAccounts = accounts.filter((account) => account.status === 'active');
  const quickType = quickForm.watch('type');
  const activeCategories = categories.filter((category) => category.status === 'active' && category.type === quickType);
  const latestTransactions = transactions.slice(0, 5);
  const activeBudgets = (budgetsQuery.data ?? []).filter((budget) => budget.recordStatus === 'active');
  const warningBudgets = activeBudgets.filter((budget) => budget.status !== 'normal').slice(0, 3);
  const upcomingScheduled = scheduledUpcomingQuery.data?.slice(0, 4) ?? [];
  const dashboardSummary = useMemo(
    () => buildDashboardSummary(activeAccounts, transactions),
    [activeAccounts, transactions],
  );
  const budgetSummary = useMemo(() => {
    const totalBudgeted = activeBudgets.reduce((total, budget) => total + budget.maxAmount, 0);
    const totalSpent = activeBudgets.reduce((total, budget) => total + budget.spentAmount, 0);
    const nearLimitCount = activeBudgets.filter(
      (budget) => budget.status === 'moderate-warning' || budget.status === 'important-warning',
    ).length;
    const exceededCount = activeBudgets.filter((budget) => budget.status === 'exceeded').length;
    const percentageUsed = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    return {
      totalBudgeted,
      totalSpent,
      nearLimitCount,
      exceededCount,
      percentageUsed,
    };
  }, [activeBudgets]);
  const hasLoadError = accountsQuery.isError || transactionsQuery.isError || budgetsQuery.isError;
  const loadingCore = accountsQuery.isLoading || transactionsQuery.isLoading;
  const saveQuickTransactionMutation = useMutation({
    mutationFn: (values: QuickTransactionSubmitValues) =>
      createTransaction({
        type: values.type,
        amount: values.amount,
        sourceAccountId: values.sourceAccountId,
        categoryId: values.categoryId,
        description: values.description.trim(),
        date: values.date,
        status: 'completed',
        note: values.note?.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success('Movimiento registrado.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
      ]);
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
    <div className="grid gap-6">
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance disponible"
          value={formatCurrency(dashboardSummary.availableBalance)}
          helper={`${activeAccounts.length} cuenta${activeAccounts.length === 1 ? '' : 's'} activa${activeAccounts.length === 1 ? '' : 's'}`}
          icon={Landmark}
          tone="info"
        />
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(dashboardSummary.currentMonthIncome)}
          helper={`${formatSignedPercent(dashboardSummary.incomeComparison)} vs. mes anterior`}
          icon={ArrowUpRight}
          tone="positive"
        />
        <StatCard
          label="Gastos del mes"
          value={formatCurrency(dashboardSummary.currentMonthExpenses)}
          helper={`${formatSignedPercent(dashboardSummary.expenseComparison)} vs. mes anterior`}
          icon={ArrowDownRight}
          tone="danger"
        />
        <StatCard
          label="Diferencia"
          value={formatCurrency(dashboardSummary.cashflowDifference)}
          helper={dashboardSummary.cashflowDifference >= 0 ? 'Flujo positivo este mes' : 'Gastos por encima de ingresos'}
          icon={TrendingUp}
          tone={dashboardSummary.cashflowDifference >= 0 ? 'positive' : 'warning'}
        />
      </section>

      {loadingCore ? <Card>Cargando tu resumen financiero...</Card> : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Últimas transacciones</h2>
              <p className="text-sm text-subtle">Movimientos recientes registrados en tus cuentas.</p>
            </div>
            <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          {latestTransactions.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="Aún no hay transacciones"
              description="Registra tu primer ingreso o gasto para empezar a leer tu flujo del mes."
              actionLabel="Registrar movimiento"
              onAction={() => openQuickPanel('expense')}
            />
          ) : (
            <div className="grid gap-3">
              {latestTransactions.map((transaction) => (
                <TransactionPreview key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Presupuestos</h2>
              <p className="mt-1 text-sm text-subtle">
                {formatCurrency(budgetSummary.totalSpent)} usados de {formatCurrency(budgetSummary.totalBudgeted)}
              </p>
            </div>
            <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={cn(
                'h-2 rounded-full',
                budgetSummary.percentageUsed >= 100
                  ? 'bg-danger'
                  : budgetSummary.percentageUsed >= 75
                    ? 'bg-warning'
                    : 'bg-positive',
              )}
              style={{ width: `${Math.min(budgetSummary.percentageUsed, 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-subtle">
            {budgetSummary.nearLimitCount} cerca del límite · {budgetSummary.exceededCount} excedido{budgetSummary.exceededCount === 1 ? '' : 's'}
          </p>
          <div className="mt-5 grid gap-4">
            {warningBudgets.length === 0 ? (
              <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
                Tus presupuestos activos están dentro del rango esperado.
              </p>
            ) : (
              warningBudgets.map((budget) => (
                <button
                  key={budget.id}
                  type="button"
                  className="rounded-panel border border-border p-3 text-left transition hover:border-primary/40 hover:bg-muted"
                  onClick={() => navigate('/app/budgets')}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-text">{budget.name}</span>
                    <Badge tone={budget.status === 'exceeded' ? 'expense' : 'warning'}>{budget.percentageUsed}%</Badge>
                  </div>
                  <p className="text-xs text-subtle">Restante: {formatCurrency(budget.remainingAmount)}</p>
                </button>
              ))
            )}
          </div>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/budgets')}>
            Ver presupuestos
          </Button>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Cuentas principales</h2>
              <p className="text-sm text-subtle">Balance por cuenta activa.</p>
            </div>
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          {activeAccounts.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
              Agrega una cuenta para ver tu balance aquí.
            </p>
          ) : (
            <div className="grid gap-3">
              {activeAccounts.slice(0, 4).map((account) => (
                <AccountPreview key={account.id} account={account} />
              ))}
            </div>
          )}
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/accounts')}>
            Ver cuentas
          </Button>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Próximos movimientos</h2>
              <p className="text-sm text-subtle">Programados que se registrarán automáticamente.</p>
            </div>
            <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          {upcomingScheduled.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
              No tienes movimientos programados para los próximos días.
            </p>
          ) : (
            <div className="grid gap-3">
              {upcomingScheduled.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col gap-2 rounded-panel border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-text">{movement.name}</p>
                    <p className="text-sm text-subtle">
                      {formatDate(movement.date)} · {movement.category}
                    </p>
                  </div>
                  <span className={cn('font-semibold', movement.type === 'income' ? 'text-positive' : 'text-danger')}>
                    {movement.type === 'income' ? '+' : '-'} {formatCurrency(movement.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/scheduled')}>
            Ver todos
          </Button>
        </Card>
      </section>

      {quickPanelOpen ? (
        <div
          className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saveQuickTransactionMutation.isPending) {
              closeQuickPanel();
            }
          }}
        >
          <div className="ml-auto grid h-full w-full max-w-2xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  {quickType === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}
                </h2>
                <p className="mt-1 text-sm text-subtle">
                  Guarda un movimiento rápido sin salir del dashboard.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={closeQuickPanel}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <form
              className="grid gap-4"
              onSubmit={quickForm.handleSubmit((values) => saveQuickTransactionMutation.mutate(values))}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Tipo">
                  <Select
                    {...quickForm.register('type')}
                    onChange={(event) => {
                      quickForm.setValue('type', event.target.value as 'income' | 'expense', {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      quickForm.setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </Select>
                </Field>
                <Field label="Monto" error={quickForm.formState.errors.amount?.message}>
                  <Input type="number" min="0" step="0.01" {...quickForm.register('amount')} />
                </Field>
                <Field label="Fecha" error={quickForm.formState.errors.date?.message}>
                  <Input type="date" {...quickForm.register('date')} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Cuenta" error={quickForm.formState.errors.sourceAccountId?.message}>
                  <Select {...quickForm.register('sourceAccountId')}>
                    <option value="">Seleccionar cuenta</option>
                    {activeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} · {formatCurrency(account.currentBalance, account.currency)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Categoría" error={quickForm.formState.errors.categoryId?.message}>
                  <Select {...quickForm.register('categoryId')}>
                    <option value="">Seleccionar categoría</option>
                    {activeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Descripción" error={quickForm.formState.errors.description?.message}>
                <Input placeholder={quickType === 'income' ? 'Pago de cliente' : 'Supermercado'} {...quickForm.register('description')} />
              </Field>

              <Field label="Nota">
                <Input placeholder="Detalle opcional" {...quickForm.register('note')} />
              </Field>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeQuickPanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveQuickTransactionMutation.isPending}>
                  {saveQuickTransactionMutation.isPending ? 'Guardando...' : 'Guardar movimiento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TransactionPreview({ transaction }: { transaction: Transaction }) {
  const copy = {
    income: { label: 'Ingreso', tone: 'income' as const, sign: '+', className: 'text-positive' },
    expense: { label: 'Gasto', tone: 'expense' as const, sign: '-', className: 'text-danger' },
    transfer: { label: 'Transferencia', tone: 'transfer' as const, sign: '', className: 'text-text' },
  }[transaction.type];

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-text">{transaction.description}</p>
        <p className="text-sm text-subtle">
          {transaction.category ?? transaction.destinationAccount ?? 'Transferencia'} · {formatDate(transaction.date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={copy.tone}>{copy.label}</Badge>
        <span className={cn('font-semibold', copy.className)}>
          {copy.sign ? `${copy.sign} ` : ''}
          {formatCurrency(transaction.amount, transaction.currency)}
        </span>
      </div>
    </div>
  );
}

function AccountPreview({ account }: { account: Account }) {
  const AccountIcon = accountTypeIcons[account.type];

  return (
    <div className="flex items-center justify-between gap-3 rounded-panel border border-border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <AccountIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{account.name}</p>
          <p className="text-xs text-subtle">{accountTypeLabels[account.type]}</p>
        </div>
      </div>
      <span className="shrink-0 font-semibold text-text">{formatCurrency(account.currentBalance, account.currency)}</span>
    </div>
  );
}

function buildDashboardSummary(accounts: Account[], transactions: Transaction[]) {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = getMonthKey(previousMonthDate);
  const completedTransactions = transactions.filter((transaction) => transaction.status === 'completed');
  const currentMonthTransactions = completedTransactions.filter((transaction) => getMonthKey(new Date(transaction.date)) === currentMonthKey);
  const previousMonthTransactions = completedTransactions.filter((transaction) => getMonthKey(new Date(transaction.date)) === previousMonthKey);
  const currentMonthIncome = sumTransactions(currentMonthTransactions, 'income');
  const currentMonthExpenses = sumTransactions(currentMonthTransactions, 'expense');
  const previousMonthIncome = sumTransactions(previousMonthTransactions, 'income');
  const previousMonthExpenses = sumTransactions(previousMonthTransactions, 'expense');

  return {
    availableBalance: accounts.reduce((total, account) => total + account.currentBalance, 0),
    currentMonthIncome,
    currentMonthExpenses,
    cashflowDifference: currentMonthIncome - currentMonthExpenses,
    incomeComparison: calculateComparison(currentMonthIncome, previousMonthIncome),
    expenseComparison: calculateComparison(currentMonthExpenses, previousMonthExpenses),
  };
}

function sumTransactions(transactions: Transaction[], type: Transaction['type']) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function calculateComparison(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value}%`;
}
