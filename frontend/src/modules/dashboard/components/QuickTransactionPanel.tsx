import { X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { CategorySelect } from '../../../components/finance/CategorySelect';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { Account, Category } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';
import type { QuickTransactionSubmitValues, QuickTransactionValues } from '../dashboard.schema';

interface QuickTransactionPanelProps {
  form: UseFormReturn<QuickTransactionValues, unknown, QuickTransactionSubmitValues>;
  quickType: 'income' | 'expense';
  selectedCategoryId: string;
  activeAccounts: Account[];
  activeCategories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: QuickTransactionSubmitValues) => void;
}

export function QuickTransactionPanel({
  form,
  quickType,
  selectedCategoryId,
  activeAccounts,
  activeCategories,
  saving,
  onClose,
  onSubmit,
}: QuickTransactionPanelProps) {
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
              {quickType === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}
            </h2>
            <p className="mt-1 text-sm text-subtle">
              Guarda un movimiento rápido sin salir del dashboard.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tipo">
              <Select
                {...form.register('type')}
                onChange={(event) => {
                  form.setValue('type', event.target.value as 'income' | 'expense', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
                }}
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
            </Field>
            <Field label="Monto" error={form.formState.errors.amount?.message}>
              <Input type="number" min="0" step="0.01" {...form.register('amount')} />
            </Field>
            <Field label="Fecha" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register('date')} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="Categoría" error={form.formState.errors.categoryId?.message}>
              <CategorySelect
                categories={activeCategories}
                value={selectedCategoryId}
                onChange={(categoryId) => form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true })}
              />
            </Field>
          </div>

          <Field label="Descripción" error={form.formState.errors.description?.message}>
            <Input placeholder={quickType === 'income' ? 'Pago de cliente' : 'Supermercado'} {...form.register('description')} />
          </Field>

          <Field label="Nota">
            <Input placeholder="Detalle opcional" {...form.register('note')} />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar movimiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
