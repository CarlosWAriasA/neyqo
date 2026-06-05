import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Edit,
  Pause,
  Play,
  Power,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createScheduledMovement,
  deactivateScheduledMovement,
  getAccounts,
  getCategories,
  getGeneratedScheduledTransactions,
  getScheduledMovements,
  getScheduledSummary,
  getUpcomingScheduledMovements,
  pauseScheduledMovement,
  resumeScheduledMovement,
  updateScheduledMovement,
  type ScheduledTransactionPayload,
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
import type { ScheduledMovement } from '../../types/financial';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';

const scheduledSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    name: z.string().trim().min(2, 'Escribe un nombre.').max(120),
    amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
    sourceAccountId: z.string().min(1, 'Selecciona una cuenta.'),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
    firstDayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    secondDayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    monthOfYear: z.coerce.number().int().min(1).max(12).optional(),
    startDate: z.string().min(1, 'Selecciona una fecha inicial.'),
    endDate: z.string().optional(),
    description: z.string().trim().max(140).optional(),
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'La fecha final no puede ser anterior a la inicial.',
      });
    }

    if (value.frequency === 'biweekly' && value.firstDayOfMonth === value.secondDayOfMonth) {
      context.addIssue({
        code: 'custom',
        path: ['secondDayOfMonth'],
        message: 'Los días quincenales deben ser distintos.',
      });
    }
  });

type ScheduledFormValues = z.input<typeof scheduledSchema>;
type ScheduledFormSubmitValues = z.output<typeof scheduledSchema>;
type ScheduledFilter = 'all' | 'active' | 'paused' | 'expense' | 'income';

const today = new Date().toISOString().slice(0, 10);

const emptyScheduledValues: ScheduledFormValues = {
  type: 'expense',
  name: '',
  amount: 0,
  sourceAccountId: '',
  categoryId: '',
  frequency: 'monthly',
  dayOfWeek: 1,
  firstDayOfMonth: 15,
  secondDayOfMonth: 30,
  monthOfYear: 1,
  startDate: today,
  endDate: '',
  description: '',
};

const frequencyLabel = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
} satisfies Record<ScheduledMovement['frequency'], string>;

const statusCopy = {
  active: {
    label: 'Activo',
    description: 'Se registrará automáticamente',
    tone: 'income' as const,
  },
  paused: {
    label: 'Pausado',
    description: 'No se registrará hasta que lo reactives',
    tone: 'warning' as const,
  },
  completed: {
    label: 'Finalizado',
    description: 'Alcanzó su fecha final',
    tone: 'neutral' as const,
  },
  inactive: {
    label: 'Desactivado',
    description: 'Ya no generará movimientos',
    tone: 'neutral' as const,
  },
} satisfies Record<ScheduledMovement['status'], { label: string; description: string; tone: 'income' | 'warning' | 'neutral' }>;

const weekDays = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function ScheduledPage() {
  const [filter, setFilter] = useState<ScheduledFilter>('all');
  const [query, setQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedScheduled, setSelectedScheduled] = useState<ScheduledMovement | null>(null);
  const queryClient = useQueryClient();
  const scheduledQuery = useQuery({ queryKey: ['scheduled-movements'], queryFn: getScheduledMovements });
  const upcomingQuery = useQuery({ queryKey: ['scheduled-upcoming'], queryFn: getUpcomingScheduledMovements });
  const summaryQuery = useQuery({ queryKey: ['scheduled-summary'], queryFn: getScheduledSummary });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const generatedQuery = useQuery({
    queryKey: ['scheduled-generated', selectedScheduled?.id],
    queryFn: () => getGeneratedScheduledTransactions(selectedScheduled!.id),
    enabled: detailOpen && Boolean(selectedScheduled),
  });
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

  const scheduled = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (scheduledQuery.data ?? []).filter((item) => {
      const matchesFilter =
        filter === 'all' ||
        item.status === filter ||
        item.type === filter;
      const matchesQuery =
        !normalizedQuery ||
        [item.name, item.category, item.account, item.description ?? ''].join(' ').toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [scheduledQuery.data, filter, query]);

  const saveMutation = useMutation({
    mutationFn: (values: ScheduledFormSubmitValues) => {
      const payload = toScheduledPayload(values);
      return selectedScheduled
        ? updateScheduledMovement(selectedScheduled.id, payload)
        : createScheduledMovement(payload);
    },
    onSuccess: async () => {
      toast.success(selectedScheduled ? 'Programado actualizado correctamente.' : 'Programado creado correctamente.');
      await refreshScheduledQueries(queryClient);
      closePanel();
    },
    onError: (error) => {
      toast.error(getScheduledErrorMessage(error, 'No pudimos guardar el programado. Revisa los datos e intenta nuevamente.'));
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado pausado correctamente.');
      await refreshScheduledQueries(queryClient);
    },
    onError: (error) => toast.error(getScheduledErrorMessage(error, 'No pudimos pausar el programado.')),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado reactivado correctamente.');
      await refreshScheduledQueries(queryClient);
    },
    onError: (error) => toast.error(getScheduledErrorMessage(error, 'No pudimos reactivar el programado.')),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateScheduledMovement,
    onSuccess: async () => {
      toast.success('Programado desactivado correctamente.');
      await refreshScheduledQueries(queryClient);
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
    const confirmed = window.confirm('Pausar programado\n\nMientras esté pausado, no se registrarán nuevos movimientos automáticamente.');

    if (confirmed) {
      pauseMutation.mutate(item.id);
    }
  }

  function handleResume(item: ScheduledMovement) {
    const confirmed = window.confirm('Reactivar programado\n\nLos próximos movimientos volverán a registrarse automáticamente.');

    if (confirmed) {
      resumeMutation.mutate(item.id);
    }
  }

  function handleDeactivate(item: ScheduledMovement) {
    const confirmed = window.confirm('Desactivar programado\n\nEste programado dejará de generar nuevos movimientos. Su historial permanecerá disponible.');

    if (confirmed) {
      deactivateMutation.mutate(item.id);
    }
  }

  return (
    <div className="grid gap-6">
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

      <section className="grid gap-4 md:grid-cols-3">
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

      {scheduledQuery.isError ? (
        <ErrorState
          title="No pudimos cargar tus movimientos programados"
          description="Inténtalo nuevamente."
          onRetry={() => void scheduledQuery.refetch()}
        />
      ) : null}

      <Card className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Próximos movimientos</h2>
            <p className="text-sm text-subtle">Ordenados por fecha para los próximos días.</p>
          </div>
          {upcomingQuery.isLoading ? <Badge tone="neutral">Cargando...</Badge> : null}
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
            No tienes movimientos programados para los próximos días.
          </p>
        ) : (
          <div className="grid gap-4">
            {groupUpcomingByDate(upcoming).map((group) => (
              <div key={group.date} className="grid gap-2">
                <p className="text-sm font-semibold text-text">{formatDate(group.date)}</p>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-panel border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-text">{item.name}</p>
                      <p className="text-sm text-subtle">
                        {item.category} · {item.account}
                      </p>
                    </div>
                    <span className={cn('font-semibold', item.type === 'income' ? 'text-positive' : 'text-danger')}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
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

      {scheduledQuery.isLoading ? <Card>Cargando programados...</Card> : null}

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
        <section className="grid gap-4 xl:grid-cols-2">
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
      ) : null}

      {panelOpen ? (
        <ScheduledPanel
          form={form}
          selectedScheduled={selectedScheduled}
          selectedType={selectedType}
          selectedFrequency={selectedFrequency}
          selectedAmount={Number(selectedAmount) || 0}
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
          generated={generatedQuery.data ?? []}
          loading={generatedQuery.isLoading}
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

function ScheduledCard({
  item,
  onDetail,
  onEdit,
  onPause,
  onResume,
  onDeactivate,
  pending,
}: {
  item: ScheduledMovement;
  onDetail: () => void;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onDeactivate: () => void;
  pending: boolean;
}) {
  const status = statusCopy[item.status];

  return (
    <Card className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-text">{item.name}</h2>
          <p className="mt-1 text-sm text-subtle">{item.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={item.type === 'income' ? 'income' : 'expense'}>
            {item.type === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm text-subtle">Monto</p>
          <p className={cn('text-2xl font-semibold', item.type === 'income' ? 'text-positive' : 'text-danger')}>
            {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-subtle">Próxima fecha</p>
          <p className="font-semibold text-text">{item.nextExecutionDate ? formatDate(item.nextExecutionDate) : 'Sin fecha próxima'}</p>
        </div>
      </div>
      <div className="rounded-panel bg-muted p-3 text-sm text-subtle">
        <p className="font-medium text-text">{item.category} · {item.account}</p>
        <p className="mt-1">{formatFrequency(item)}</p>
        <p className="mt-1">{status.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onDetail}>Ver detalle</Button>
        {item.status !== 'completed' && item.status !== 'inactive' ? (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
        ) : null}
        {item.status === 'active' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onPause}>
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pausar
          </Button>
        ) : null}
        {item.status === 'paused' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onResume}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Reactivar
          </Button>
        ) : null}
        {item.status !== 'completed' && item.status !== 'inactive' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onDeactivate}>
            <Power className="h-4 w-4" aria-hidden="true" />
            Desactivar
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function ScheduledPanel({
  form,
  selectedScheduled,
  selectedType,
  selectedFrequency,
  selectedAmount,
  selectedCategoryName,
  selectedStartDate,
  selectedName,
  activeAccounts,
  activeCategories,
  saving,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ScheduledFormValues, unknown, ScheduledFormSubmitValues>>;
  selectedScheduled: ScheduledMovement | null;
  selectedType: 'income' | 'expense';
  selectedFrequency: ScheduledMovement['frequency'];
  selectedAmount: number;
  selectedCategoryName?: string;
  selectedStartDate: string;
  selectedName: string;
  activeAccounts: Array<{ id: string; name: string; currentBalance: number; currency: string }>;
  activeCategories: Array<{ id: string; name: string }>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduledFormSubmitValues) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="ml-auto grid h-full w-full max-w-3xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{selectedScheduled ? 'Editar programado' : 'Nuevo programado'}</h2>
            <p className="mt-1 text-sm text-subtle">
              {selectedScheduled
                ? 'Los cambios se aplicarán a las próximas transacciones. Los movimientos anteriores no serán modificados.'
                : 'Configura cómo y cuándo se registrará automáticamente.'}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" error={form.formState.errors.name?.message}>
              <Input placeholder="Netflix" {...form.register('name')} />
            </Field>
            <Field label="Tipo de movimiento">
              <Select
                {...form.register('type')}
                onChange={(event) => {
                  form.setValue('type', event.target.value as 'income' | 'expense', { shouldDirty: true, shouldValidate: true });
                  form.setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
                }}
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Monto" error={form.formState.errors.amount?.message}>
              <Input type="number" min="0" step="0.01" {...form.register('amount')} />
            </Field>
            <Field label="Categoría" error={form.formState.errors.categoryId?.message}>
              <Select {...form.register('categoryId')}>
                <option value="">Seleccionar categoría</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Cuenta" error={form.formState.errors.sourceAccountId?.message}>
              <Select {...form.register('sourceAccountId')}>
                <option value="">Seleccionar cuenta</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {formatCurrency(account.currentBalance, account.currency)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Frecuencia">
              <Select {...form.register('frequency')}>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </Select>
            </Field>
            <Field label="Fecha de inicio" error={form.formState.errors.startDate?.message}>
              <Input type="date" {...form.register('startDate')} />
            </Field>
            <Field label="Fecha de finalización" error={form.formState.errors.endDate?.message}>
              <Input type="date" {...form.register('endDate')} />
            </Field>
          </div>

          <RepeatFields form={form} frequency={selectedFrequency} />

          <Field label="Descripción">
            <Input placeholder="Detalle opcional" {...form.register('description')} />
          </Field>

          <Card className="bg-muted shadow-none">
            <p className="font-semibold text-text">{selectedName || 'Vista previa'}</p>
            <p className="mt-2 text-sm leading-6 text-subtle">
              {buildPreview({
                name: selectedName,
                type: selectedType,
                amount: selectedAmount,
                category: selectedCategoryName,
                frequency: selectedFrequency,
                startDate: selectedStartDate,
                dayOfWeek: Number(form.watch('dayOfWeek')),
                firstDayOfMonth: Number(form.watch('firstDayOfMonth')),
                secondDayOfMonth: Number(form.watch('secondDayOfMonth')),
                monthOfYear: Number(form.watch('monthOfYear')),
              })}
            </p>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RepeatFields({
  form,
  frequency,
}: {
  form: ReturnType<typeof useForm<ScheduledFormValues, unknown, ScheduledFormSubmitValues>>;
  frequency: ScheduledMovement['frequency'];
}) {
  if (frequency === 'weekly') {
    return (
      <Field label="Día de la semana">
        <Select {...form.register('dayOfWeek')}>
          {weekDays.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
        </Select>
      </Field>
    );
  }

  if (frequency === 'biweekly') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Primer día del mes" error={form.formState.errors.firstDayOfMonth?.message}>
          <Input type="number" min="1" max="31" {...form.register('firstDayOfMonth')} />
        </Field>
        <Field label="Segundo día del mes" error={form.formState.errors.secondDayOfMonth?.message}>
          <Input type="number" min="1" max="31" {...form.register('secondDayOfMonth')} />
        </Field>
        <p className="text-sm text-subtle md:col-span-2">Si el mes no tiene ese día, se registrará el último día disponible.</p>
      </div>
    );
  }

  if (frequency === 'monthly') {
    return (
      <Field label="Día del mes" error={form.formState.errors.firstDayOfMonth?.message}>
        <Input type="number" min="1" max="31" {...form.register('firstDayOfMonth')} />
        {Number(form.watch('firstDayOfMonth')) >= 29 ? (
          <span className="text-xs font-normal text-subtle">Si el mes no tiene ese día, se registrará el último día disponible.</span>
        ) : null}
      </Field>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Día" error={form.formState.errors.firstDayOfMonth?.message}>
        <Input type="number" min="1" max="31" {...form.register('firstDayOfMonth')} />
      </Field>
      <Field label="Mes" error={form.formState.errors.monthOfYear?.message}>
        <Select {...form.register('monthOfYear')}>
          {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
        </Select>
      </Field>
      {Number(form.watch('firstDayOfMonth')) >= 29 ? (
        <p className="text-sm text-subtle md:col-span-2">Si el mes no tiene ese día, se registrará el último día disponible.</p>
      ) : null}
    </div>
  );
}

function ScheduledDetailPanel({
  item,
  generated,
  loading,
  onClose,
  onEdit,
}: {
  item: ScheduledMovement;
  generated: Array<{ id: string; date: string; description: string; amount: number; type: string; account: string; category?: string; status: string }>;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto grid h-full w-full max-w-3xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{item.name}</h2>
            <p className="mt-1 text-sm text-subtle">{statusCopy[item.status].description}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem label="Tipo" value={item.type === 'income' ? 'Ingreso' : 'Gasto'} />
          <DetailItem label="Monto" value={formatCurrency(item.amount)} />
          <DetailItem label="Categoría" value={item.category} />
          <DetailItem label="Cuenta" value={item.account} />
          <DetailItem label="Frecuencia" value={frequencyLabel[item.frequency]} />
          <DetailItem label="Próxima fecha" value={item.nextExecutionDate ? formatDate(item.nextExecutionDate) : 'Sin fecha próxima'} />
          <DetailItem label="Fecha inicial" value={formatDate(item.startDate)} />
          <DetailItem label="Fecha final" value={item.endDate ? formatDate(item.endDate) : 'Sin fecha final'} />
          <DetailItem label="Estado" value={statusCopy[item.status].label} />
          {item.description ? <DetailItem label="Descripción" value={item.description} /> : null}
        </div>

        <div className="flex justify-end">
          {item.status !== 'completed' && item.status !== 'inactive' ? (
            <Button variant="secondary" onClick={onEdit}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          ) : null}
        </div>

        <Card className="grid gap-4">
          <div>
            <h3 className="font-semibold text-text">Historial de movimientos generados</h3>
            <p className="text-sm text-subtle">Movimientos creados automáticamente desde este programado.</p>
          </div>
          {loading ? <p className="text-sm text-subtle">Cargando historial...</p> : null}
          {!loading && generated.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
              Todavía no se han generado movimientos para este programado.
            </p>
          ) : null}
          {generated.length > 0 ? (
            <div className="grid gap-2">
              {generated.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid gap-2 rounded-panel border border-border p-3 text-sm md:grid-cols-[120px_1fr_120px_1fr]"
                >
                  <span className="text-subtle">{formatDate(transaction.date)}</span>
                  <span className="font-medium text-text">{transaction.description}</span>
                  <span className="font-semibold text-text">{formatCurrency(transaction.amount)}</span>
                  <span className="text-subtle">{transaction.account} · {transaction.category ?? 'Sin categoría'}</span>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-panel border border-border p-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1 font-medium text-text">{value}</p>
    </div>
  );
}

function toScheduledPayload(values: ScheduledFormSubmitValues): ScheduledTransactionPayload {
  return {
    type: values.type,
    name: values.name.trim(),
    amount: values.amount,
    sourceAccountId: values.sourceAccountId,
    categoryId: values.categoryId,
    frequency: values.frequency,
    dayOfWeek: values.frequency === 'weekly' ? values.dayOfWeek : undefined,
    daysOfMonth: getDaysOfMonth(values),
    monthOfYear: values.frequency === 'yearly' ? values.monthOfYear : undefined,
    startDate: values.startDate,
    endDate: values.endDate || undefined,
    description: values.description?.trim() || undefined,
  };
}

function getDaysOfMonth(values: ScheduledFormSubmitValues) {
  if (values.frequency === 'weekly') {
    return undefined;
  }

  if (values.frequency === 'biweekly') {
    return [values.firstDayOfMonth ?? 15, values.secondDayOfMonth ?? 30];
  }

  return [values.firstDayOfMonth ?? 1];
}

function toFormValues(item: ScheduledMovement): ScheduledFormValues {
  return {
    type: item.type,
    name: item.name,
    amount: item.amount,
    sourceAccountId: item.sourceAccountId ?? '',
    categoryId: item.categoryId ?? '',
    frequency: item.frequency,
    dayOfWeek: item.dayOfWeek ?? 1,
    firstDayOfMonth: item.daysOfMonth?.[0] ?? 15,
    secondDayOfMonth: item.daysOfMonth?.[1] ?? 30,
    monthOfYear: item.monthOfYear ?? 1,
    startDate: item.startDate,
    endDate: item.endDate ?? '',
    description: item.description ?? '',
  };
}

function formatFrequency(item: ScheduledMovement) {
  if (item.frequency === 'weekly') {
    return `Semanal · cada ${weekDays.find((day) => day.value === item.dayOfWeek)?.label.toLowerCase() ?? 'semana'}`;
  }

  if (item.frequency === 'biweekly') {
    return `Quincenal · días ${(item.daysOfMonth ?? []).join(' y ')}`;
  }

  if (item.frequency === 'monthly') {
    return `Mensual · cada día ${item.daysOfMonth?.[0] ?? 1}`;
  }

  return `Anual · cada ${item.daysOfMonth?.[0] ?? 1} de ${months[(item.monthOfYear ?? 1) - 1].toLowerCase()}`;
}

function buildPreview(params: {
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  frequency: ScheduledMovement['frequency'];
  startDate: string;
  dayOfWeek: number;
  firstDayOfMonth: number;
  secondDayOfMonth: number;
  monthOfYear: number;
}) {
  const typeLabel = params.type === 'income' ? 'ingreso' : 'gasto';
  const category = params.category ?? 'la categoría seleccionada';
  const amount = params.amount > 0 ? formatCurrency(params.amount) : 'un monto';
  const cadence =
    params.frequency === 'weekly'
      ? `cada ${weekDays.find((day) => day.value === params.dayOfWeek)?.label.toLowerCase() ?? 'semana'}`
      : params.frequency === 'biweekly'
        ? `los días ${params.firstDayOfMonth} y ${params.secondDayOfMonth} de cada mes`
        : params.frequency === 'monthly'
          ? `cada día ${params.firstDayOfMonth} del mes`
          : `cada ${params.firstDayOfMonth} de ${months[params.monthOfYear - 1].toLowerCase()}`;
  const start = params.startDate ? ` a partir del ${formatDate(params.startDate)}` : '';

  return `Se registrará un ${typeLabel} de ${amount} en ${category} ${cadence}${start}.`;
}

function summarizeUpcoming(upcoming: Array<{ type: 'income' | 'expense'; amount: number }>) {
  const expenseTotal = upcoming.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amount, 0);
  const incomeTotal = upcoming.filter((item) => item.type === 'income').reduce((total, item) => total + item.amount, 0);

  return {
    expenseTotal,
    incomeTotal,
    balance: incomeTotal - expenseTotal,
  };
}

function groupUpcomingByDate(upcoming: Array<{ id: string; date: string; type: 'income' | 'expense'; name: string; amount: number; category: string; account: string }>) {
  const groups = new Map<string, typeof upcoming>();

  for (const item of upcoming) {
    groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  }

  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

async function refreshScheduledQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['scheduled-movements'] }),
    queryClient.invalidateQueries({ queryKey: ['scheduled-upcoming'] }),
    queryClient.invalidateQueries({ queryKey: ['scheduled-summary'] }),
    queryClient.invalidateQueries({ queryKey: ['scheduled-generated'] }),
  ]);
}

function getScheduledErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
