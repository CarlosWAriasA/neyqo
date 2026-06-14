import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CategorySelect } from '../../../components/finance/CategorySelect';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { Budget, Category } from '../../../types/financial';
import { weekDayOptions } from '../budgets.constants';
import type { BudgetFormSubmitValues, BudgetFormValues } from '../budgets.schema';

interface BudgetPanelProps {
  form: UseFormReturn<BudgetFormValues, unknown, BudgetFormSubmitValues>;
  selectedBudget: Budget | null;
  selectedPeriod: Budget['period'];
  selectedCategoryId: string;
  periodPreview: string;
  expenseCategories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: BudgetFormSubmitValues) => void;
}

export function BudgetPanel({
  form,
  selectedBudget,
  selectedPeriod,
  selectedCategoryId,
  periodPreview,
  expenseCategories,
  saving,
  onClose,
  onSubmit,
}: BudgetPanelProps) {
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const amountField = form.register('maxAmount');

  useEffect(() => {
    if (selectedBudget) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [selectedBudget]);

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
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
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
            <CategorySelect
              categories={expenseCategories}
              value={selectedCategoryId}
              placeholder="Seleccionar categoría"
              clearable
              onChange={(categoryId) => form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true })}
            />
          </Field>

          <Field label="Descripción">
            <Input placeholder="Detalle opcional" {...form.register('description')} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
