import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, CalendarClock, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createScheduledMovement,
  deactivateScheduledMovement,
  pauseScheduledMovement,
  resumeScheduledMovement,
  updateScheduledMovement,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { InfiniteListBoundary } from '../../components/common/InfiniteListBoundary';
import { CardGridSkeleton, StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import {
  invalidateScheduled,
  useAccounts,
  useCategories,
  useInfiniteGeneratedScheduledTransactions,
  useInfiniteScheduledMovements,
  useScheduledSummary,
  useScheduledUpcoming,
} from '../../features/finance/hooks';
import { flattenPages } from '../../features/finance/pagination';
import type { ScheduledMovement } from '../../types/financial';
import { formatCurrency } from '../../utils/format';
import { ScheduledCard } from './components/ScheduledCard';
import { ScheduledDetailPanel } from './components/ScheduledDetailPanel';
import { ScheduledPanel } from './components/ScheduledPanel';
import {
  emptyScheduledValues,
  scheduledSchema,
  type ScheduledFilter,
  type ScheduledFormSubmitValues,
  type ScheduledFormValues,
} from './scheduled.schema';
import { getScheduledErrorMessage, summarizeUpcoming, toFormValues, toScheduledPayload } from './scheduled.utils';

export function ScheduledPage() {
  const [filter, setFilter] = useState<ScheduledFilter>('all');
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedScheduled, setSelectedScheduled] = useState<ScheduledMovement | null>(null);
  const queryClient = useQueryClient();
  const scheduledQuery = useInfiniteScheduledMovements({
    query: query.trim() || undefined,
    status: filter === 'active' || filter === 'paused' ? filter : undefined,
    type: filter === 'income' || filter === 'expense' ? filter : undefined,
  });
  const upcomingQuery = useScheduledUpcoming();
  const summaryQuery = useScheduledSummary();
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const generatedQuery = useInfiniteGeneratedScheduledTransactions(detailOpen ? selectedScheduled?.id : undefined);
  const form = useForm<ScheduledFormValues, unknown, ScheduledFormSubmitValues>({
    resolver: zodResolver(scheduledSchema),
    defaultValues: emptyScheduledValues,
  });
  const selectedType = form.watch('type');
  const selectedFrequency = form.watch('frequency');
  const selectedAmount = form.watch('amount');
  const selectedCategoryId = form.watch('categoryId');
  const selectedStartDate = form.watch('startDate');
  const selectedName = form.watch('name');
  const activeAccounts = (accountsQuery.data ?? []).filter((account) => account.status === 'active');
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.status === 'active' && category.type === selectedType,
  );
  const selectedCategory = activeCategories.find((category) => category.id === selectedCategoryId);
  const upcoming = upcomingQuery.data ?? [];
  const summary = summaryQuery.data ?? summarizeUpcoming(upcoming);
  const scheduled = flattenPages(scheduledQuery.data?.pages);

  const saveMutation = useMutation({
    mutationFn: (values: ScheduledFormSubmitValues) => {
      const payload = toScheduledPayload(values);
      return selectedScheduled
        ? updateScheduledMovement(selectedScheduled.id, payload)
        : createScheduledMovement(payload);
    },
    onSuccess: async () => {
      toast.success(selectedScheduled ? 'Programado actualizado correctamente.' : 'Programado creado correctamente.');
      await invalidateScheduled(queryClient);
      closePanel();
    },
    onError: (error) => {
      toast.error(
        getScheduledErrorMessage(
          error,
          'No pudimos guardar el programado. Revisa los datos e intenta nuevamente.',
        ),
      );
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado pausado correctamente.');
      await invalidateScheduled(queryClient);
    },
    onError: (error) => toast.error(getScheduledErrorMessage(error, 'No pudimos pausar el programado.')),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado reactivado correctamente.');
      await invalidateScheduled(queryClient);
    },
    onError: (error) => toast.error(getScheduledErrorMessage(error, 'No pudimos reactivar el programado.')),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado desactivado correctamente.');
      await invalidateScheduled(queryClient);
    },
    onError: (error) => toast.error(getScheduledErrorMessage(error, 'No pudimos desactivar el programado.')),
  });

  function openCreatePanel() {
    setSelectedScheduled(null);
    form.reset(emptyScheduledValues);
    setPanelOpen(true);
  }

  function openEditPanel(item: ScheduledMovement) {
    setSelectedScheduled(item);
    form.reset(toFormValues(item));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedScheduled(null);
    form.reset(emptyScheduledValues);
  }

  function openDetail(item: ScheduledMovement) {
    setSelectedScheduled(item);
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelectedScheduled(null);
  }

  function handlePause(item: ScheduledMovement) {
    const confirmed = window.confirm(
      'Pausar programado\n\nMientras esté pausado, no se registrarán nuevos movimientos automáticamente.',
    );

    if (confirmed) {
      pauseMutation.mutate(item.id);
    }
  }

  function handleResume(item: ScheduledMovement) {
    const confirmed = window.confirm(
      'Reactivar programado\n\nLos próximos movimientos volverán a registrarse automáticamente.',
    );

    if (confirmed) {
      resumeMutation.mutate(item.id);
    }
  }

  function handleDeactivate(item: ScheduledMovement) {
    const confirmed = window.confirm(
      'Desactivar programado\n\nEste programado dejará de generar nuevos movimientos. Su historial permanecerá disponible.',
    );

    if (confirmed) {
      deactivateMutation.mutate(item.id);
    }
  }

  return (
    <div className="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Programados"
        description="Automatiza tus gastos e ingresos recurrentes para mantener tus movimientos al día sin registrarlos manualmente."
        actions={
          <Button onClick={openCreatePanel}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo programado
          </Button>
        }
      />

      {summaryQuery.isLoading ? (
        <StatGridSkeleton />
      ) : (
        <section className="grid grid-cols-3 gap-2 md:gap-4">
          <StatCard
            label="Gastos programados"
            value={formatCurrency(summary.expenseTotal)}
            helper="Próximos 30 días"
            icon={ArrowDownRight}
            tone="danger"
          />
          <StatCard
            label="Ingresos programados"
            value={formatCurrency(summary.incomeTotal)}
            helper="Próximos 30 días"
            icon={ArrowUpRight}
            tone="positive"
          />
          <StatCard
            label="Balance esperado"
            value={formatCurrency(summary.balance)}
            helper="Ingresos menos gastos programados"
            icon={CalendarClock}
            tone={summary.balance >= 0 ? 'positive' : 'warning'}
          />
        </section>
      )}

      <Card className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, cuenta o categoría"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select value={filter} onChange={(event) => setFilter(event.target.value as ScheduledFilter)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="paused">Pausados</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </Select>
        </div>
      </Card>

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          {scheduledQuery.isError ? (
            <ErrorState
              title="No pudimos cargar tus movimientos programados"
              description="Inténtalo nuevamente."
              onRetry={() => void scheduledQuery.refetch()}
            />
          ) : null}

          {scheduledQuery.isLoading ? <CardGridSkeleton variant="detailed" /> : null}

          {!scheduledQuery.isLoading && !scheduledQuery.isError && scheduled.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Todavía no tienes movimientos programados."
              description="Agrega tus pagos recurrentes, como suscripciones o servicios, y Neyqo los registrará automáticamente en la fecha indicada."
              actionLabel="Crear mi primer programado"
              onAction={openCreatePanel}
            />
          ) : null}

          {scheduled.length > 0 ? (
            <InfiniteListBoundary
              hasNextPage={Boolean(scheduledQuery.hasNextPage)}
              isFetchingNextPage={scheduledQuery.isFetchingNextPage}
              onLoadMore={() => void scheduledQuery.fetchNextPage()}
            >
              <section className="grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
                {scheduled.map((item) => (
                  <ScheduledCard
                    key={item.id}
                    item={item}
                    onDetail={() => openDetail(item)}
                    onEdit={() => openEditPanel(item)}
                    onPause={() => handlePause(item)}
                    onResume={() => handleResume(item)}
                    onDeactivate={() => handleDeactivate(item)}
                    pending={pauseMutation.isPending || resumeMutation.isPending || deactivateMutation.isPending}
                  />
                ))}
              </section>
            </InfiniteListBoundary>
          ) : null}
        </div>
      </div>

      {panelOpen ? (
        <ScheduledPanel
          form={form}
          selectedScheduled={selectedScheduled}
          selectedType={selectedType}
          selectedFrequency={selectedFrequency}
          selectedAmount={Number(selectedAmount) || 0}
          selectedCategoryId={selectedCategoryId}
          selectedCategoryName={selectedCategory?.name}
          selectedStartDate={selectedStartDate}
          selectedName={selectedName}
          activeAccounts={activeAccounts}
          activeCategories={activeCategories}
          saving={saveMutation.isPending}
          onClose={closePanel}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      ) : null}

      {detailOpen && selectedScheduled ? (
        <ScheduledDetailPanel
          item={selectedScheduled}
          generated={flattenPages(generatedQuery.data?.pages)}
          loading={generatedQuery.isLoading}
          hasMoreGenerated={Boolean(generatedQuery.hasNextPage)}
          loadingMoreGenerated={generatedQuery.isFetchingNextPage}
          onLoadMoreGenerated={() => void generatedQuery.fetchNextPage()}
          onClose={closeDetail}
          onEdit={() => {
            setDetailOpen(false);
            openEditPanel(selectedScheduled);
          }}
        />
      ) : null}
    </div>
  );
}
