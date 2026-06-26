import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { X } from 'lucide-react';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { accountTypeLabels } from '../../../config/navigation';
import type { Account } from '../../../types/financial';
import type { AccountFormSubmitValues, AccountFormValues } from '../accounts.schema';

interface AccountPanelProps {
  form: UseFormReturn<AccountFormValues, unknown, AccountFormSubmitValues>;
  selectedAccount: Account | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AccountFormSubmitValues) => void;
}

export function AccountPanel({
  form,
  selectedAccount,
  saving,
  onClose,
  onSubmit,
}: AccountPanelProps) {
  const nameField = form.register('name');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [selectedAccount]);

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
      <div className="ml-auto grid h-full w-full max-w-xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">
              {selectedAccount ? 'Editar cuenta' : 'Nueva cuenta'}
            </h2>
            <p className="mt-1 text-sm text-subtle">Define dónde entra, sale o queda apartado tu dinero.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Nombre" error={form.formState.errors.name?.message}>
            <Input
              placeholder="Cuenta de ahorro"
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
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda">
              <Select {...form.register('currency')}>
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Institución" error={form.formState.errors.institutionName?.message}>
              <Input placeholder="Banco, billetera o emisor" {...form.register('institutionName')} />
            </Field>
            <Field label="Últimos 4 dígitos" error={form.formState.errors.lastFour?.message}>
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                {...form.register('lastFour')}
              />
            </Field>
          </div>
          <Field label="Balance inicial" error={form.formState.errors.initialBalance?.message}>
            <Input type="number" step="0.01" {...form.register('initialBalance')} />
            <p className="mt-1 text-xs leading-5 text-subtle">
              Al editarlo, Neyqo ajusta el balance actual por la diferencia y mantiene tus movimientos.
            </p>
          </Field>
          {selectedAccount ? (
            <p className="rounded-panel border border-border bg-muted/30 p-3 text-xs leading-5 text-subtle">
              La moneda solo puede cambiarse si la cuenta todavía no tiene movimientos, pagos programados o reglas de importación activas.
            </p>
          ) : null}
          <Field label="Descripción" error={form.formState.errors.description?.message}>
            <Input placeholder="Uso principal de la cuenta" {...form.register('description')} />
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
