import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createCategory,
  deactivateCategory,
  reactivateCategory,
  updateCategory,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { CardGridSkeleton, StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useCategories } from '../../features/finance/hooks';
import { financeQueryKeys } from '../../features/finance/queryKeys';
import type { Category } from '../../types/financial';
import { CategoryCard } from './components/CategoryCard';
import { CategoryFilters } from './components/CategoryFilters';
import { CategoryPanel } from './components/CategoryPanel';
import {
  categorySchema,
  emptyCategoryValues,
  type CategoryFormSubmitValues,
  type CategoryFormValues,
  type CategoryStatusFilter,
  type CategoryTypeFilter,
} from './categories.schema';
import {
  getCategoryErrorMessage,
  sortCategories,
  toCategoryFormValues,
  toCategoryPayload,
} from './categories.utils';

export function CategoriesPage() {
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [statusChangingCategoryId, setStatusChangingCategoryId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const form = useForm<CategoryFormValues, unknown, CategoryFormSubmitValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategoryValues,
  });
  const allCategories = categoriesQuery.data ?? [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const categories = allCategories.filter(
    (category) =>
      (typeFilter === 'all' || category.type === typeFilter) &&
      (statusFilter === 'all' || category.status === statusFilter) &&
      (normalizedSearchTerm.length === 0 ||
        `${category.name} ${category.description ?? ''}`.toLowerCase().includes(normalizedSearchTerm)),
  );
  const sortedCategories = sortCategories(categories);
  const incomeCount = allCategories.filter((category) => category.type === 'income').length;
  const expenseCount = allCategories.filter((category) => category.type === 'expense').length;
  const customCount = allCategories.filter((category) => !category.isDefault).length;

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

  const saveCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormSubmitValues) => {
      const payload = toCategoryPayload(values);
      return selectedCategory
        ? updateCategory(selectedCategory.id, payload)
        : createCategory(payload);
    },
    onSuccess: async () => {
      toast.success(selectedCategory ? 'Categoría actualizada.' : 'Categoría creada.');
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.categories });
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
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.categories });
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
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.categories });
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
    form.reset(toCategoryFormValues(category));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedCategory(null);
    form.reset(emptyCategoryValues);
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

      {categoriesQuery.isLoading ? (
        <StatGridSkeleton />
      ) : (
        <section className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Gastos</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{expenseCount}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Ingresos</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{incomeCount}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Personalizadas</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{customCount}</p>
          </Card>
        </section>
      )}

      <CategoryFilters
        searchTerm={searchTerm}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
      />

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          {categoriesQuery.isError ? (
            <ErrorState
              title="No pudimos cargar tus categorías"
              description="Reintenta para volver a sincronizar esta vista."
              onRetry={() => void categoriesQuery.refetch()}
            />
          ) : null}

          {categoriesQuery.isLoading ? <CardGridSkeleton variant="compact" /> : null}

          {!categoriesQuery.isLoading && !categoriesQuery.isError && sortedCategories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No hay categorías en este filtro"
              description="Crea categorías para clasificar mejor tus movimientos y reportes."
              actionLabel="Crear categoría"
              onAction={() => openCreatePanel(typeFilter === 'income' ? 'income' : 'expense')}
            />
          ) : null}

          {sortedCategories.length > 0 ? (
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
          ) : null}
        </div>
      </div>

      {panelOpen ? (
        <CategoryPanel
          form={form}
          selectedCategory={selectedCategory}
          saving={saveCategoryMutation.isPending}
          nameInputRef={nameInputRef}
          onClose={closePanel}
          onSubmit={(values) => saveCategoryMutation.mutate(values)}
        />
      ) : null}
    </div>
  );
}
