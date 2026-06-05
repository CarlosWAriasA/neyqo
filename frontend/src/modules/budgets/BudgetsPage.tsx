import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Check, ChevronDown, Edit, ListChecks, Play, Plus, Power, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createBudget,
  deactivateBudget,
  getBudgets,
  getCategories,
  reactivateBudget,
  updateBudget,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Field } from '../../components/forms/Field';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { categoryIconByValue, fallbackCategoryIcon } from '../../config/categoryIcons';
import type { Budget } from '../../types/financial';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';

const budgetSchema = z.object({
  name: z.string().min(2, 'Escribe un nombre claro.'),
  maxAmount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  period: z.enum(['monthly', 'biweekly', 'weekly']),
  resetDayOfMonth: z.coerce.number().min(1).max(31).optional(),
  resetDayOfWeek: z.coerce.number().min(0).max(6).optional(),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  description: z.string().optional(),
}).superRefine((value, context) => {
  if (value.period === 'weekly' && value.resetDayOfWeek === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['resetDayOfWeek'],
      message: 'Selecciona el día de reinicio.',
    });
  }

  if (value.period !== 'weekly' && value.resetDayOfMonth === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['resetDayOfMonth'],
      message: 'Selecciona el día de reinicio.',
    });
  }
});

type BudgetFormValues = z.input<typeof budgetSchema>;
type BudgetFormSubmitValues = z.output<typeof budgetSchema>;
type StatusFilter = 'active' | 'inactive' | 'all';

const emptyBudgetValues: BudgetFormValues = {
  name: '',
  maxAmount: 0,
  period: 'monthly',
  resetDayOfMonth: new Date().getDate(),
  resetDayOfWeek: new Date().getDay(),
  categoryId: '',
  description: '',
};

const statusCopy = {
  normal: { label: 'Normal', tone: 'income' as const, bar: 'bg-positive' },
  'moderate-warning': { label: 'Advertencia moderada', tone: 'warning' as const, bar: 'bg-warning' },
  'important-warning': { label: 'Advertencia importante', tone: 'warning' as const, bar: 'bg-warning' },
  exceeded: { label: 'Excedido', tone: 'expense' as const, bar: 'bg-danger' },
};

const periodCopy = {
  monthly: 'Mensual',
  biweekly: 'Quincenal',
  weekly: 'Semanal',
} satisfies Record<Budget['period'], string>;

const weekDayOptions = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export function BudgetsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [statusChangingBudgetId, setStatusChangingBudgetId] = useState<string | null>(null);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const categorySelectRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const form = useForm<BudgetFormValues, unknown, BudgetFormSubmitValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: emptyBudgetValues,
  });
  const amountField = form.register('maxAmount');
  const selectedPeriod = form.watch('period');
  const selectedResetDayOfMonth = Number(form.watch('resetDayOfMonth') ?? new Date().getDate());
  const selectedResetDayOfWeek = Number(form.watch('resetDayOfWeek') ?? new Date().getDay());
  const selectedCategoryId = form.watch('categoryId');
  const expenseCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.status === 'active' && category.type === 'expense',
  );
  const selectedCategories = expenseCategories.filter((category) => category.id === selectedCategoryId);

  useEffect(() => {
    if (!panelOpen || selectedBudget) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [panelOpen, selectedBudget]);

  useEffect(() => {
    if (!categorySelectOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!categorySelectRef.current?.contains(event.target as Node)) {
        setCategorySelectOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [categorySelectOpen]);

  const budgets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (budgetsQuery.data ?? []).filter((budget) => {
      const matchesText =
        !normalizedQuery ||
        `${budget.name} ${budget.category} ${budget.description ?? ''}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all' || budget.recordStatus === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [budgetsQuery.data, query, statusFilter]);

  const totalBudgetLimit = (budgetsQuery.data ?? [])
    .filter((budget) => budget.recordStatus === 'active')
    .reduce((total, budget) => total + budget.maxAmount, 0);
  const totalBudgetSpent = (budgetsQuery.data ?? [])
    .filter((budget) => budget.recordStatus === 'active')
    .reduce((total, budget) => total + budget.spentAmount, 0);
  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const exceededBudgetCount = (budgetsQuery.data ?? []).filter(
    (budget) => budget.recordStatus === 'active' && budget.status === 'exceeded',
  ).length;
  const periodPreview = getBudgetPeriodPreview(
    selectedPeriod,
    selectedResetDayOfMonth,
    selectedResetDayOfWeek,
  );

  const saveBudgetMutation = useMutation({
    mutationFn: (values: BudgetFormSubmitValues) => {
      const payload = {
        ...values,
        resetDayOfMonth: values.period === 'weekly' ? null : values.resetDayOfMonth,
        resetDayOfWeek: values.period === 'weekly' ? values.resetDayOfWeek : null,
        categoryIds: [values.categoryId],
        description: values.description?.trim() || undefined,
      };

      return selectedBudget
        ? updateBudget(selectedBudget.id, payload)
        : createBudget(payload);
    },
    onSuccess: async () => {
      toast.success(selectedBudget ? 'Presupuesto actualizado.' : 'Presupuesto creado.');
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
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
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
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
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
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
    form.reset({
      name: budget.name,
      maxAmount: budget.maxAmount,
      period: budget.period,
      resetDayOfMonth: budget.resetDayOfMonth ?? new Date().getDate(),
      resetDayOfWeek: budget.resetDayOfWeek ?? new Date().getDay(),
      categoryId: budget.categoryId ?? budget.categoryIds[0] ?? '',
      description: budget.description ?? '',
    });
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedBudget(null);
    setCategorySelectOpen(false);
    form.reset(emptyBudgetValues);
  }

  function selectCategory(categoryId: string) {
    form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true });
    setCategorySelectOpen(false);
  }

  function clearCategory() {
    form.setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
  }

  function handleSubmit(values: BudgetFormSubmitValues) {
    saveBudgetMutation.mutate(values);
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

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-subtle">Total presupuestado</p>
          <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(totalBudgetLimit)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Consumido</p>
          <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(totalBudgetSpent)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Disponible</p>
          <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(totalBudgetRemaining)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Presupuestos excedidos</p>
          <p className="mt-2 text-2xl font-semibold text-text">{exceededBudgetCount}</p>
        </Card>
      </section>

      <Card className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
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
          <Select className="lg:w-48" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
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

          {!budgetsQuery.isError && budgets.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Todavía no tienes presupuestos activos."
              description="Crea uno para definir cuánto deseas gastar en cada categoría y llevar un mejor control de tus gastos."
              actionLabel="Crear presupuesto"
              onAction={openCreatePanel}
            />
          ) : (
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
          )}
        </div>
      </div>

      {panelOpen ? (
        <div
          className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saveBudgetMutation.isPending) {
              closePanel();
            }
          }}
        >
          <div className="ml-auto grid h-full w-full max-w-2xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  {selectedBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
                </h2>
                <p className="mt-1 text-sm text-subtle">
                  Agrupa categorías de gasto y define cuándo se reinicia el límite.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={closePanel}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre" error={form.formState.errors.name?.message}>
                  <Input placeholder="Comida" {...form.register('name')} />
                </Field>
                <Field label="Monto máximo" error={form.formState.errors.maxAmount?.message}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...amountField}
                    ref={(node) => {
                      amountField.ref(node);
                      amountInputRef.current = node;
                    }}
                  />
                </Field>
              </div>

              <Field label="Reinicio">
                <Select {...form.register('period')}>
                  <option value="monthly">Cada mes</option>
                  <option value="biweekly">Cada quincena</option>
                  <option value="weekly">Cada semana</option>
                </Select>
              </Field>

              {selectedPeriod === 'weekly' ? (
                <Field label="Día de reinicio" error={form.formState.errors.resetDayOfWeek?.message}>
                  <Select {...form.register('resetDayOfWeek')}>
                    {weekDayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <Field
                  label={selectedPeriod === 'biweekly' ? 'Día inicial de la quincena' : 'Día de reinicio mensual'}
                  error={form.formState.errors.resetDayOfMonth?.message}
                >
                  <Input type="number" min="1" max="31" {...form.register('resetDayOfMonth')} />
                </Field>
              )}

              <p className="rounded-panel bg-muted px-3 py-2 text-sm text-subtle">{periodPreview}</p>

              <Field label="Categoría" error={form.formState.errors.categoryId?.message}>
                <div ref={categorySelectRef} className="relative">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-panel border border-border bg-surface px-3 text-left text-sm text-text transition hover:bg-muted"
                    aria-expanded={categorySelectOpen}
                    aria-haspopup="listbox"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCategorySelectOpen((open) => !open);
                    }}
                  >
                    <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                      {selectedCategories.length === 0 ? (
                        <span className="text-subtle">Seleccionar categorías</span>
                      ) : (
                        selectedCategories.map((category) => {
                          const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;

                          return (
                            <span
                              key={category.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pl-2 pr-1 text-xs font-medium text-text"
                            >
                              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                              {category.name}
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={`Quitar ${category.name}`}
                                className="rounded-full p-0.5 text-subtle transition hover:bg-surface hover:text-text"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  clearCategory();
                                }}
                                onKeyDown={(event) => {
                                  event.stopPropagation();

                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    clearCategory();
                                  }
                                }}
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                              </span>
                            </span>
                          );
                        })
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                  </button>

                  {categorySelectOpen ? (
                    <div
                      className="category-scrollbar absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-panel border border-border bg-surface p-2 shadow-panel"
                      role="listbox"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {expenseCategories.map((category) => {
                        const selected = selectedCategoryId === category.id;
                        const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            className={cn(
                              'flex min-h-11 w-full items-center justify-between gap-3 rounded-panel px-3 text-left text-sm transition hover:bg-muted',
                              selected && 'bg-primary-soft text-primary',
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectCategory(category.id);
                            }}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="truncate font-medium">{category.name}</span>
                            </span>
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border',
                                selected && 'border-primary bg-primary text-white',
                              )}
                            >
                              {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="Descripción">
                <Input placeholder="Detalle opcional" {...form.register('description')} />
              </Field>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closePanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveBudgetMutation.isPending}>
                  {saveBudgetMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailBudget ? <BudgetDetailDialog budget={detailBudget} onClose={() => setDetailBudget(null)} /> : null}
    </div>
  );
}

function BudgetCard({
  budget,
  isChangingStatus,
  onEdit,
  onOpenDetail,
  onDeactivate,
  onReactivate,
}: {
  budget: Budget;
  isChangingStatus: boolean;
  onEdit: () => void;
  onOpenDetail: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  const status = statusCopy[budget.status];
  const exceededBy = Math.max(0, budget.spentAmount - budget.maxAmount);

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-text">{budget.name}</h2>
          <p className="mt-1 text-sm text-subtle">{budget.periodLabel}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="neutral">{periodCopy[budget.period]}</Badge>
          <Badge tone={budget.recordStatus === 'active' ? status.tone : 'neutral'}>
            {budget.recordStatus === 'active' ? status.label : 'Inactivo'}
          </Badge>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-subtle">{formatCurrency(budget.spentAmount)} de {formatCurrency(budget.maxAmount)}</span>
          <span className="font-semibold text-text">{budget.percentageUsed}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted">
          <div
            className={`h-3 rounded-full ${budget.recordStatus === 'active' ? status.bar : 'bg-subtle'}`}
            style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-subtle">Límite</p>
          <p className="font-semibold text-text">{formatCurrency(budget.maxAmount)}</p>
        </div>
        <div>
          <p className="text-subtle">Gastado</p>
          <p className="font-semibold text-text">{formatCurrency(budget.spentAmount)}</p>
        </div>
        <div>
          <p className="text-subtle">Restante</p>
          <p className="font-semibold text-text">{formatCurrency(budget.remainingAmount)}</p>
        </div>
      </div>

      <div className="text-sm">
        {budget.status === 'exceeded' ? (
          <p className="font-medium text-danger">Excedido por {formatCurrency(exceededBy)}</p>
        ) : (
          <p className="text-subtle">Finaliza el {formatDate(budget.periodEnd)}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {budget.categories.map((category) => {
          const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;

          return (
            <Badge key={category.id} tone="neutral" className="gap-1.5">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {category.name}
            </Badge>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onOpenDetail}>
          Ver detalle
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
        {budget.recordStatus === 'active' ? (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onDeactivate}>
            <Power className="h-4 w-4" aria-hidden="true" />
            {isChangingStatus ? 'Desactivando...' : 'Desactivar'}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onReactivate}>
            <Play className="h-4 w-4" aria-hidden="true" />
            {isChangingStatus ? 'Reactivando...' : 'Reactivar'}
          </Button>
        )}
      </div>
    </Card>
  );
}

function BudgetDetailDialog({ budget, onClose }: { budget: Budget; onClose: () => void }) {
  const status = statusCopy[budget.status];

  return (
    <div
      className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ml-auto grid h-full w-full max-w-3xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{budget.name}</h2>
            <p className="mt-1 text-sm text-subtle">
              {budget.category} · {periodCopy[budget.period]} · {formatDate(budget.periodStart)} - {formatDate(budget.periodEnd)}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <Card>
            <p className="text-sm text-subtle">Presupuestado</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.maxAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Consumido</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.spentAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Disponible</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.remainingAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Días restantes</p>
            <p className="mt-2 font-semibold text-text">{budget.daysRemaining}</p>
          </Card>
        </section>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-subtle">Progreso</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div className={`h-3 rounded-full ${status.bar}`} style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }} />
          </div>
        </div>

        <section>
          <h3 className="text-base font-semibold text-text">Gastos incluidos</h3>
          <div className="mt-3 grid gap-2">
            {budget.currentExpenses.length === 0 ? (
              <p className="text-sm text-subtle">No hay gastos en este período.</p>
            ) : (
              budget.currentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 rounded-panel border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium text-text">{expense.description}</p>
                    <p className="text-subtle">{expense.category} · {formatDate(expense.date)}</p>
                  </div>
                  <span className="font-semibold text-text">{formatCurrency(expense.amount)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-text">Historial de períodos</h3>
          <div className="mt-3 grid gap-2">
            {budget.periodHistory.map((period) => (
              <div key={period.id} className="grid gap-2 rounded-panel border border-border p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-medium text-text">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                  <p className="text-subtle">{period.status === 'active' ? 'Activo' : 'Cerrado'}</p>
                </div>
                <span>{formatCurrency(period.spentAmount)} de {formatCurrency(period.budgetedAmount)}</span>
                <span className={cn('font-semibold', period.remainingAmount < 0 ? 'text-danger' : 'text-text')}>
                  {formatCurrency(period.remainingAmount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function getBudgetPeriodPreview(
  period: Budget['period'],
  resetDayOfMonth?: number,
  resetDayOfWeek?: number,
) {
  const now = new Date();
  const range =
    period === 'weekly'
      ? resolveWeeklyPreview(now, resetDayOfWeek ?? now.getDay())
      : period === 'biweekly'
        ? resolveBiweeklyPreview(now, resetDayOfMonth ?? now.getDate())
        : resolveMonthlyPreview(now, resetDayOfMonth ?? now.getDate());

  if (period === 'weekly') {
    const weekDay = weekDayOptions.find((day) => day.value === (resetDayOfWeek ?? now.getDay()))?.label ?? 'este día';
    return `Este presupuesto se reiniciará cada ${weekDay.toLowerCase()}. Período actual: ${formatDate(range.startDate)} al ${formatDate(range.endDate)}.`;
  }

  const resetDay = resetDayOfMonth ?? now.getDate();
  return `Este presupuesto se reiniciará cada día ${resetDay}. Período actual: ${formatDate(range.startDate)} al ${formatDate(range.endDate)}.`;
}

function resolveWeeklyPreview(date: Date, resetDayOfWeek: number) {
  const target = parseLocalDate(toDateOnly(date));
  const daysSinceReset = (target.getDay() - resetDayOfWeek + 7) % 7;
  const start = addDays(target, -daysSinceReset);
  const end = addDays(start, 6);

  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}

function resolveBiweeklyPreview(date: Date, resetDayOfMonth: number) {
  const target = parseLocalDate(toDateOnly(date));
  const candidates = [
    getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth),
    addDays(getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth), 15),
    getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth),
    addDays(getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth), 15),
    getMonthResetDate(target.getFullYear(), target.getMonth() + 1, resetDayOfMonth),
  ].sort((first, second) => first.getTime() - second.getTime());

  for (let index = 0; index < candidates.length - 1; index += 1) {
    const start = candidates[index];
    const end = addDays(candidates[index + 1], -1);

    if (target >= start && target <= end) {
      return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
    }
  }

  return { startDate: toDateOnly(candidates[0]), endDate: toDateOnly(addDays(candidates[1], -1)) };
}

function resolveMonthlyPreview(date: Date, resetDayOfMonth: number) {
  const target = parseLocalDate(toDateOnly(date));
  let start = getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth);

  if (target < start) {
    start = getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth);
  }

  const nextStart = getMonthResetDate(start.getFullYear(), start.getMonth() + 1, resetDayOfMonth);
  const end = addDays(nextStart, -1);

  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}

function getMonthResetDate(year: number, month: number, requestedDay: number) {
  const normalizedMonth = new Date(year, month, 1);
  const lastDay = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth() + 1, 0).getDate();
  return new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), Math.min(requestedDay, lastDay));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getBudgetErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
