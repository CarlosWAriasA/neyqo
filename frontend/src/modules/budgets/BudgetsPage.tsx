import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListChecks, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createBudget,
  deactivateBudget,
  reactivateBudget,
  updateBudget,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { InfiniteListBoundary } from '../../components/common/InfiniteListBoundary';
import { CardGridSkeleton, StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Field } from '../../components/forms/Field';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { invalidateBudgets, useBudget, useCategories, useInfiniteBudgets } from '../../features/finance/hooks';
import { flattenPages } from '../../features/finance/pagination';
import type { Budget } from '../../types/financial';
import { formatCurrency } from '../../utils/format';
import { BudgetCard } from './components/BudgetCard';
import { BudgetDetailDialog } from './components/BudgetDetailDialog';
import { BudgetPanel } from './components/BudgetPanel';
import {
  budgetSchema,
  emptyBudgetValues,
  type BudgetFormSubmitValues,
  type BudgetFormValues,
  type BudgetStatusFilter,
} from './budgets.schema';
import { getBudgetErrorMessage, getBudgetPeriodPreview, toBudgetFormValues, toBudgetPayload } from './budgets.utils';

export function BudgetsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatusFilter>('active');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [statusChangingBudgetId, setStatusChangingBudgetId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const budgetsQuery = useInfiniteBudgets({ status: statusFilter, query: query.trim() || undefined });
  const categoriesQuery = useCategories();
  const detailBudgetQuery = useBudget(detailBudget?.id);
  const form = useForm<BudgetFormValues, unknown, BudgetFormSubmitValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: emptyBudgetValues,
  });
  const selectedPeriod = form.watch('period');
  const selectedResetDayOfMonth = Number(form.watch('resetDayOfMonth') ?? new Date().getDate());
  const selectedResetDayOfWeek = Number(form.watch('resetDayOfWeek') ?? new Date().getDay());
  const selectedCategoryId = form.watch('categoryId');
  const expenseCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.status === 'active' && category.type === 'expense',
  );
  const budgets = flattenPages(budgetsQuery.data?.pages);
  const activeBudgets = budgets.filter((budget) => budget.recordStatus === 'active');
  const totalBudgetLimit = activeBudgets.reduce((total, budget) => total + budget.maxAmount, 0);
  const totalBudgetSpent = activeBudgets.reduce((total, budget) => total + budget.spentAmount, 0);
  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const exceededBudgetCount = activeBudgets.filter((budget) => budget.status === 'exceeded').length;
  const periodPreview = getBudgetPeriodPreview(
    selectedPeriod,
    selectedResetDayOfMonth,
    selectedResetDayOfWeek,
  );

  const saveBudgetMutation = useMutation({
    mutationFn: (values: BudgetFormSubmitValues) => {
      const payload = toBudgetPayload(values);
      return selectedBudget
        ? updateBudget(selectedBudget.id, payload)
        : createBudget(payload);
    },
    onSuccess: async () => {
      toast.success(selectedBudget ? 'Presupuesto actualizado.' : 'Presupuesto creado.');
      await invalidateBudgets(queryClient);
      closePanel();
    },
    onError: (error) => {
      toast.error(getBudgetErrorMessage(error, 'No pudimos guardar el presupuesto.'));
    },
  });

  const deactivateBudgetMutation = useMutation({
    mutationFn: deactivateBudget,
    onMutate: (budgetId) => setStatusChangingBudgetId(budgetId),
    onSuccess: async () => {
      toast.success('Presupuesto desactivado.');
      await invalidateBudgets(queryClient);
    },
    onError: (error) => {
      toast.error(getBudgetErrorMessage(error, 'No pudimos desactivar el presupuesto.'));
    },
    onSettled: () => setStatusChangingBudgetId(null),
  });

  const reactivateBudgetMutation = useMutation({
    mutationFn: reactivateBudget,
    onMutate: (budgetId) => setStatusChangingBudgetId(budgetId),
    onSuccess: async () => {
      toast.success('Presupuesto reactivado.');
      await invalidateBudgets(queryClient);
    },
    onError: (error) => {
      toast.error(getBudgetErrorMessage(error, 'No pudimos reactivar el presupuesto.'));
    },
    onSettled: () => setStatusChangingBudgetId(null),
  });

  function openCreatePanel() {
    setSelectedBudget(null);
    form.reset(emptyBudgetValues);
    setPanelOpen(true);
  }

  function openEditPanel(budget: Budget) {
    setSelectedBudget(budget);
    form.reset(toBudgetFormValues(budget));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedBudget(null);
    form.reset(emptyBudgetValues);
  }

  return (
    <div className="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Presupuestos"
        description="Define límites recurrentes por semana o por mes agrupando una o varias categorías de gasto."
        actions={
          <Button onClick={openCreatePanel}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crear presupuesto
          </Button>
        }
      />

      {budgetsQuery.isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Presupuestado</p>
            <p className="mt-1 text-base font-semibold text-text sm:mt-2 sm:text-2xl">{formatCurrency(totalBudgetLimit)}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Consumido</p>
            <p className="mt-1 text-base font-semibold text-text sm:mt-2 sm:text-2xl">{formatCurrency(totalBudgetSpent)}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Disponible</p>
            <p className="mt-1 text-base font-semibold text-text sm:mt-2 sm:text-2xl">{formatCurrency(totalBudgetRemaining)}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Excedidos</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{exceededBudgetCount}</p>
          </Card>
        </section>
      )}

      <Card className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" aria-hidden="true" />
          <Input
            className="pl-9"
            placeholder="Buscar presupuesto o categoría"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Field label="Estado">
          <Select className="lg:w-48" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BudgetStatusFilter)}>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </Select>
        </Field>
      </Card>

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          {budgetsQuery.isError ? (
            <ErrorState
              title="No pudimos cargar tus presupuestos"
              description="Reintenta para volver a sincronizar esta vista."
              onRetry={() => void budgetsQuery.refetch()}
            />
          ) : null}

          {budgetsQuery.isLoading ? <CardGridSkeleton variant="detailed" /> : null}

          {!budgetsQuery.isLoading && !budgetsQuery.isError && budgets.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Todavía no tienes presupuestos activos."
              description="Crea uno para definir cuánto deseas gastar en cada categoría y llevar un mejor control de tus gastos."
              actionLabel="Crear presupuesto"
              onAction={openCreatePanel}
            />
          ) : null}

          {budgets.length > 0 ? (
            <InfiniteListBoundary
              hasNextPage={Boolean(budgetsQuery.hasNextPage)}
              isFetchingNextPage={budgetsQuery.isFetchingNextPage}
              onLoadMore={() => void budgetsQuery.fetchNextPage()}
            >
              <section className="grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    isChangingStatus={statusChangingBudgetId === budget.id}
                    onEdit={() => openEditPanel(budget)}
                    onOpenDetail={() => setDetailBudget(budget)}
                    onDeactivate={() => deactivateBudgetMutation.mutate(budget.id)}
                    onReactivate={() => reactivateBudgetMutation.mutate(budget.id)}
                  />
                ))}
              </section>
            </InfiniteListBoundary>
          ) : null}
        </div>
      </div>

      {panelOpen ? (
        <BudgetPanel
          form={form}
          selectedBudget={selectedBudget}
          selectedPeriod={selectedPeriod}
          selectedCategoryId={selectedCategoryId}
          periodPreview={periodPreview}
          expenseCategories={expenseCategories}
          saving={saveBudgetMutation.isPending}
          onClose={closePanel}
          onSubmit={(values) => saveBudgetMutation.mutate(values)}
        />
      ) : null}

      {detailBudget ? (
        <BudgetDetailDialog
          budget={detailBudgetQuery.data ?? detailBudget}
          loading={detailBudgetQuery.isLoading}
          onClose={() => setDetailBudget(null)}
        />
      ) : null}
    </div>
  );
}
