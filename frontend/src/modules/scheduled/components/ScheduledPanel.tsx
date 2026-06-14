import type { UseFormReturn } from 'react-hook-form';
import { X } from 'lucide-react';
import { CategorySelect } from '../../../components/finance/CategorySelect';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { Category, ScheduledMovement } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';
import { months, weekDays } from '../scheduled.constants';
import type { ScheduledFormSubmitValues, ScheduledFormValues } from '../scheduled.schema';
import { buildPreview } from '../scheduled.utils';

interface ScheduledPanelProps {
  form: UseFormReturn<ScheduledFormValues, unknown, ScheduledFormSubmitValues>;
  selectedScheduled: ScheduledMovement | null;
  selectedType: 'income' | 'expense';
  selectedFrequency: ScheduledMovement['frequency'];
  selectedAmount: number;
  selectedCategoryId: string;
  selectedCategoryName?: string;
  selectedStartDate: string;
  selectedName: string;
  activeAccounts: Array<{
    id: string;
    name: string;
    currentBalance: number;
    currency: string;
  }>;
  activeCategories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduledFormSubmitValues) => void;
}

export function ScheduledPanel({
  form,
  selectedScheduled,
  selectedType,
  selectedFrequency,
  selectedAmount,
  selectedCategoryId,
  selectedCategoryName,
  selectedStartDate,
  selectedName,
  activeAccounts,
  activeCategories,
  saving,
  onClose,
  onSubmit,
}: ScheduledPanelProps) {
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
            <h2 className="text-xl font-semibold text-text">
              {selectedScheduled ? 'Editar programado' : 'Nuevo programado'}
            </h2>
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
                  form.setValue('type', event.target.value as 'income' | 'expense', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue('categoryId', '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
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
              <CategorySelect
                categories={activeCategories}
                value={selectedCategoryId}
                onChange={(categoryId) => form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true })}
              />
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

function RepeatFields({
  form,
  frequency,
}: {
  form: UseFormReturn<ScheduledFormValues, unknown, ScheduledFormSubmitValues>;
  frequency: ScheduledMovement['frequency'];
}) {
  if (frequency === 'weekly') {
    return (
      <Field label="Día de la semana">
        <Select {...form.register('dayOfWeek')}>
          {weekDays.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
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
        <p className="text-sm text-subtle md:col-span-2">
          Si el mes no tiene ese día, se registrará el último día disponible.
        </p>
      </div>
    );
  }

  if (frequency === 'monthly') {
    return (
      <Field label="Día del mes" error={form.formState.errors.firstDayOfMonth?.message}>
        <Input type="number" min="1" max="31" {...form.register('firstDayOfMonth')} />
        {Number(form.watch('firstDayOfMonth')) >= 29 ? (
          <span className="text-xs font-normal text-subtle">
            Si el mes no tiene ese día, se registrará el último día disponible.
          </span>
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
          {months.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </Select>
      </Field>
      {Number(form.watch('firstDayOfMonth')) >= 29 ? (
        <p className="text-sm text-subtle md:col-span-2">
          Si el mes no tiene ese día, se registrará el último día disponible.
        </p>
      ) : null}
    </div>
  );
}
