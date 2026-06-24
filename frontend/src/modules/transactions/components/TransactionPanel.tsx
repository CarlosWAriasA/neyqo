import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CategorySelect } from '../../../components/finance/CategorySelect';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { Account, Category, Transaction } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';
import type { TransactionFormSubmitValues, TransactionFormValues } from '../transactions.schema';

interface TransactionPanelProps {
  form: UseFormReturn<TransactionFormValues, unknown, TransactionFormSubmitValues>;
  selectedTransaction: Transaction | null;
  selectedType: Transaction['type'];
  selectedCategoryId: string;
  activeAccounts: Account[];
  activeCategories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionFormSubmitValues) => void;
}

export function TransactionPanel({
  form,
  selectedTransaction,
  selectedType,
  selectedCategoryId,
  activeAccounts,
  activeCategories,
  saving,
  onClose,
  onSubmit,
}: TransactionPanelProps) {
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const amountField = form.register('amount');
  const selectedSourceAccountId = form.watch('sourceAccountId');
  const selectedDestinationAccountId = form.watch('destinationAccountId');
  const selectedAmount = form.watch('amount');
  const selectedDestinationAmount = form.watch('destinationAmount');
  const sourceAccount = activeAccounts.find((account) => account.id === selectedSourceAccountId);
  const destinationAccount = activeAccounts.find((account) => account.id === selectedDestinationAccountId);
  const isCrossCurrencyTransfer = Boolean(
    selectedType === 'transfer' &&
    sourceAccount &&
    destinationAccount &&
    sourceAccount.currency !== destinationAccount.currency,
  );
  const impliedRate = isCrossCurrencyTransfer && Number(selectedAmount) > 0 && Number(selectedDestinationAmount) > 0
    ? Number(selectedDestinationAmount) / Number(selectedAmount)
    : null;

  useEffect(() => {
    if (selectedTransaction) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [selectedTransaction]);

  useEffect(() => {
    if (!isCrossCurrencyTransfer) {
      form.setValue('destinationAmount', undefined);
    }
  }, [form, isCrossCurrencyTransfer]);

  function handleTypeChange(type: Transaction['type']) {
    form.setValue('type', type, { shouldDirty: true, shouldValidate: true });
    form.setValue('categoryId', '', { shouldDirty: true });
    form.setValue('destinationAccountId', '', { shouldDirty: true });
    form.setValue('destinationAmount', undefined, { shouldDirty: true });
  }

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
              {selectedTransaction ? 'Editar transacción' : 'Nueva transacción'}
            </h2>
            <p className="mt-1 text-sm text-subtle">
              Los balances se actualizan cuando el estado está completado.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tipo">
              <Select value={selectedType} onChange={(event) => handleTypeChange(event.target.value as Transaction['type'])}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
                <option value="transfer">Transferencia</option>
              </Select>
            </Field>
            <Field label="Monto" error={form.formState.errors.amount?.message}>
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
            <Field label="Fecha" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register('date')} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={selectedType === 'transfer' ? 'Cuenta origen' : 'Cuenta'} error={form.formState.errors.sourceAccountId?.message}>
              <Select {...form.register('sourceAccountId')}>
                <option value="">Seleccionar cuenta</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {formatCurrency(account.currentBalance, account.currency)}
                  </option>
                ))}
              </Select>
            </Field>
            {selectedType === 'transfer' ? (
              <Field label="Cuenta destino" error={form.formState.errors.destinationAccountId?.message}>
                <Select {...form.register('destinationAccountId')}>
                  <option value="">Seleccionar destino</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {formatCurrency(account.currentBalance, account.currency)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Categoría" error={form.formState.errors.categoryId?.message}>
                <CategorySelect
                  categories={activeCategories}
                  value={selectedCategoryId}
                  onChange={(categoryId) => form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true })}
                />
              </Field>
            )}
          </div>

          {selectedType === 'transfer' && sourceAccount && destinationAccount ? (
            <div className="rounded-panel border border-border bg-muted/30 p-4">
              {isCrossCurrencyTransfer ? (
                <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                  <Field
                    label={`Monto recibido (${destinationAccount.currency})`}
                    error={form.formState.errors.destinationAmount?.message}
                  >
                    <Input type="number" min="0" step="0.01" {...form.register('destinationAmount')} />
                  </Field>
                  <div className="rounded-panel bg-surface p-4">
                    <p className="text-sm font-medium text-text">Tasa usada</p>
                    <p className="mt-1 text-sm leading-6 text-subtle">
                      {impliedRate
                        ? `1 ${sourceAccount.currency} = ${impliedRate.toFixed(6)} ${destinationAccount.currency}`
                        : 'Completa ambos montos.'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-subtle">
                  Transferencia en {sourceAccount.currency}. El monto enviado y recibido es el mismo.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Descripción" error={form.formState.errors.description?.message}>
              <Input placeholder={selectedType === 'transfer' ? 'Pago a tarjeta' : 'Supermercado'} {...form.register('description')} />
            </Field>
            <Field label="Estado">
              <Select {...form.register('status')}>
                <option value="completed">Completada</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelada</option>
              </Select>
            </Field>
          </div>

          <Field label="Nota">
            <Input placeholder="Detalle opcional" {...form.register('note')} />
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
