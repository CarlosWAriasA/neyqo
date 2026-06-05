import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  CircleEllipsis,
  Edit,
  Play,
  Plus,
  Power,
  Search,
  Tags,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createCategory,
  deactivateCategory,
  getCategories,
  reactivateCategory,
  updateCategory,
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
import { categoryIconByValue, categoryIconOptions } from '../../config/categoryIcons';
import type { Category } from '../../types/financial';
import { cn } from '../../utils/cn';

const categorySchema = z.object({
  name: z.string().min(2, 'Escribe un nombre.'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(2, 'Elige un icono.'),
  priority: z.coerce.number().int().min(1, 'Usa 1 o más.').max(999, 'Usa 999 o menos.'),
  description: z.string().optional(),
});

type CategoryFormValues = z.input<typeof categorySchema>;
type CategoryFormSubmitValues = z.output<typeof categorySchema>;
type CategoryFilter = 'all' | 'income' | 'expense';
type StatusFilter = 'active' | 'inactive' | 'all';

const emptyCategoryValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  icon: 'circle-ellipsis',
  priority: 100,
  description: '',
};

export function CategoriesPage() {
  const [typeFilter, setTypeFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [statusChangingCategoryId, setStatusChangingCategoryId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const form = useForm<CategoryFormValues, unknown, CategoryFormSubmitValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategoryValues,
  });
  const nameField = form.register('name');

  useEffect(() => {
    if (!panelOpen || selectedCategory) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [panelOpen, selectedCategory]);

  const allCategories = categoriesQuery.data ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const categories = allCategories.filter(
    (category) =>
      (typeFilter === 'all' || category.type === typeFilter) &&
      (statusFilter === 'all' || category.status === statusFilter) &&
      (normalizedSearchTerm.length === 0 ||
        `${category.name} ${category.description ?? ''}`.toLowerCase().includes(normalizedSearchTerm)),
  );
  const sortedCategories = [...categories].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'expense' ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    return left.priority - right.priority || left.name.localeCompare(right.name);
  });
  const incomeCount = allCategories.filter((category) => category.type === 'income').length;
  const expenseCount = allCategories.filter((category) => category.type === 'expense').length;
  const customCount = allCategories.filter((category) => !category.isDefault).length;

  const saveCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormSubmitValues) => {
      const payload = {
        ...values,
        description: values.description?.trim() || undefined,
      };

      return selectedCategory
        ? updateCategory(selectedCategory.id, payload)
        : createCategory(payload);
    },
    onSuccess: async () => {
      toast.success(selectedCategory ? 'Categoría actualizada.' : 'Categoría creada.');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      closePanel();
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'No pudimos guardar la categoría. Revisa los datos e intenta nuevamente.'));
    },
  });
  const deactivateCategoryMutation = useMutation({
    mutationFn: deactivateCategory,
    onMutate: (categoryId) => setStatusChangingCategoryId(categoryId),
    onSuccess: async () => {
      toast.success('Categoría desactivada.');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'No pudimos desactivar la categoría. Intenta nuevamente.'));
    },
    onSettled: () => setStatusChangingCategoryId(null),
  });
  const reactivateCategoryMutation = useMutation({
    mutationFn: reactivateCategory,
    onMutate: (categoryId) => setStatusChangingCategoryId(categoryId),
    onSuccess: async () => {
      toast.success('Categoría reactivada.');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getCategoryErrorMessage(error, 'No pudimos reactivar la categoría. Intenta nuevamente.'));
    },
    onSettled: () => setStatusChangingCategoryId(null),
  });

  function openCreatePanel(type: Category['type'] = 'expense') {
    setSelectedCategory(null);
    form.reset({ ...emptyCategoryValues, type });
    setPanelOpen(true);
  }

  function openEditPanel(category: Category) {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      type: category.type,
      icon: category.icon,
      priority: category.priority,
      description: category.description ?? '',
    });
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedCategory(null);
    form.reset(emptyCategoryValues);
  }

  function handleSubmit(values: CategoryFormSubmitValues) {
    saveCategoryMutation.mutate(values);
  }

  return (
    <div className="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Categorías"
        description="Organiza ingresos y gastos con categorías predeterminadas y personalizadas."
        actions={
          <Button onClick={() => openCreatePanel()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crear categoría
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-subtle">Categorías de gasto</p>
          <p className="mt-2 text-2xl font-semibold text-text">{expenseCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Categorías de ingreso</p>
          <p className="mt-2 text-2xl font-semibold text-text">{incomeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Personalizadas</p>
          <p className="mt-2 text-2xl font-semibold text-text">{customCount}</p>
        </Card>
      </section>

      <Card className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <div>
          <h2 className="font-semibold text-text">Biblioteca de categorías</h2>
        </div>
        <Field label="Buscar">
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Buscar categoría"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </Field>
        <Field label="Tipo">
          <Select className="lg:w-48" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as CategoryFilter)}>
            <option value="all">Todas</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </Select>
        </Field>
        <Field label="Estado">
          <Select className="lg:w-48" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="all">Todas</option>
          </Select>
        </Field>
      </Card>

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
        {categoriesQuery.isError ? (
          <ErrorState
            title="No pudimos cargar tus categorías"
            description="Reintenta para volver a sincronizar esta vista."
            onRetry={() => void categoriesQuery.refetch()}
          />
        ) : null}

        {!categoriesQuery.isError && sortedCategories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No hay categorías en este filtro"
            description="Crea categorías para clasificar mejor tus movimientos y reportes."
            actionLabel="Crear categoría"
            onAction={() => openCreatePanel(typeFilter === 'income' ? 'income' : 'expense')}
          />
        ) : (
          <section className="grid gap-3 pb-2 md:grid-cols-2 xl:grid-cols-3">
            {sortedCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isChangingStatus={statusChangingCategoryId === category.id}
                onEdit={() => openEditPanel(category)}
                onDeactivate={() => deactivateCategoryMutation.mutate(category.id)}
                onReactivate={() => reactivateCategoryMutation.mutate(category.id)}
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
            if (event.target === event.currentTarget) {
              closePanel();
            }
          }}
        >
          <div className="ml-auto grid h-full w-full max-w-xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  {selectedCategory ? 'Editar categoría' : 'Nueva categoría'}
                </h2>
                <p className="mt-1 text-sm text-subtle">
                  Define cómo quieres clasificar movimientos, presupuestos y reportes.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={closePanel}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <Field label="Nombre" error={form.formState.errors.name?.message}>
                <Input
                  placeholder="Restaurantes"
                  {...nameField}
                  ref={(node) => {
                    nameField.ref(node);
                    nameInputRef.current = node;
                  }}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select {...form.register('type')}>
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </Select>
                </Field>
                <Field label="Icono" error={form.formState.errors.icon?.message}>
                  <Select {...form.register('icon')}>
                    {categoryIconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Prioridad" error={form.formState.errors.priority?.message}>
                <Input type="number" min={1} max={999} step={1} {...form.register('priority')} />
              </Field>
              <Field label="Descripción">
                <Input placeholder="Uso opcional de esta categoría" {...form.register('description')} />
              </Field>
              <IconPicker selectedIcon={form.watch('icon')} onSelect={(icon) => form.setValue('icon', icon, { shouldDirty: true })} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closePanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveCategoryMutation.isPending}>
                  {saveCategoryMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryCard({
  category,
  isChangingStatus,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  category: Category;
  isChangingStatus: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  const Icon = categoryIconByValue[category.icon] ?? CircleEllipsis;

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-text">{category.name}</h2>
            <p className="mt-1 text-sm text-subtle">{category.description || 'Sin descripción'}</p>
          </div>
        </div>
        <Badge tone={category.type === 'income' ? 'income' : 'expense'}>
          {category.type === 'income' ? 'Ingreso' : 'Gasto'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="neutral">Prioridad {category.priority}</Badge>
        <Badge tone={category.status === 'active' ? 'income' : 'neutral'}>
          {category.status === 'active' ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
        {category.status === 'active' ? (
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

function IconPicker({ selectedIcon, onSelect }: { selectedIcon: string; onSelect: (icon: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text">Vista rápida de iconos</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {categoryIconOptions.map((option) => {
          const Icon = option.icon;
          const selected = selectedIcon === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex h-10 items-center justify-center rounded-panel border border-border text-subtle transition hover:bg-muted hover:text-text',
                selected && 'border-primary bg-primary-soft text-primary',
              )}
              title={option.label}
              onClick={() => onSelect(option.value)}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getCategoryErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
