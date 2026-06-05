import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Landmark, Play, Plus, Power, X } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createAccount,
  deactivateAccount,
  getAccounts,
  reactivateAccount,
  updateAccount,
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
import { accountTypeIcons, accountTypeLabels } from '../../config/navigation';
import type { Account } from '../../types/financial';
import { formatCurrency } from '../../utils/format';

const accountSchema = z.object({
  name: z.string().min(2, 'Escribe un nombre claro.'),
  type: z.enum(['cash', 'bank', 'debit_card', 'credit_card', 'wallet', 'other']),
  currency: z.enum(['DOP', 'USD', 'EUR']),
  initialBalance: z.coerce.number(),
  description: z.string().optional(),
});

type AccountFormValues = z.input<typeof accountSchema>;
type AccountFormSubmitValues = z.output<typeof accountSchema>;

const emptyAccountValues: AccountFormValues = {
  name: '',
  type: 'bank',
  currency: 'DOP',
  initialBalance: 0,
  description: '',
};

export function AccountsPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [statusChangingAccountId, setStatusChangingAccountId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const accounts = accountsQuery.data ?? [];
  const totalBalance = accounts.reduce((total, account) => total + account.currentBalance, 0);
  const activeAccounts = accounts.filter((account) => account.status === 'active').length;
  const form = useForm<AccountFormValues, unknown, z.output<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: emptyAccountValues,
  });
  const nameField = form.register('name');

  useEffect(() => {
    if (!panelOpen || selectedAccount) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [panelOpen, selectedAccount]);
  const saveAccountMutation = useMutation({
    mutationFn: (values: AccountFormSubmitValues) => {
      const payload = {
        ...values,
        description: values.description?.trim() || undefined,
      };

      return selectedAccount
        ? updateAccount(selectedAccount.id, payload)
        : createAccount(payload);
    },
    onSuccess: async () => {
      toast.success(selectedAccount ? 'Cuenta actualizada.' : 'Cuenta creada.');
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      closePanel();
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos guardar la cuenta. Revisa los datos e intenta nuevamente.'));
    },
  });
  const deactivateAccountMutation = useMutation({
    mutationFn: deactivateAccount,
    onMutate: (accountId) => {
      setStatusChangingAccountId(accountId);
    },
    onSuccess: async () => {
      toast.success('Cuenta desactivada.');
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos desactivar la cuenta. Intenta nuevamente.'));
    },
    onSettled: () => {
      setStatusChangingAccountId(null);
    },
  });
  const reactivateAccountMutation = useMutation({
    mutationFn: reactivateAccount,
    onMutate: (accountId) => {
      setStatusChangingAccountId(accountId);
    },
    onSuccess: async () => {
      toast.success('Cuenta reactivada.');
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos reactivar la cuenta. Intenta nuevamente.'));
    },
    onSettled: () => {
      setStatusChangingAccountId(null);
    },
  });

  function openCreatePanel() {
    setSelectedAccount(null);
    form.reset(emptyAccountValues);
    setPanelOpen(true);
  }

  function openEditPanel(account: Account) {
    setSelectedAccount(account);
    form.reset({
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
      description: account.description ?? '',
    });
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedAccount(null);
    form.reset(emptyAccountValues);
  }

  function handleSubmit(values: AccountFormSubmitValues) {
    saveAccountMutation.mutate(values);
  }

  return (
    <div className="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Cuentas"
        description="Administra efectivo, cuentas bancarias, tarjetas y billeteras digitales desde una vista simple."
        actions={
          <Button onClick={openCreatePanel}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar cuenta
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-subtle">Balance total</p>
          <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(totalBalance)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Cuentas activas</p>
          <p className="mt-2 text-2xl font-semibold text-text">{activeAccounts}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Moneda principal</p>
          <p className="mt-2 text-2xl font-semibold text-text">DOP</p>
        </Card>
      </section>

      {accountsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar tus cuentas"
          description="Reintenta para volver a sincronizar esta vista."
          onRetry={() => void accountsQuery.refetch()}
        />
      ) : null}

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          {!accountsQuery.isError && accounts.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Aún no tienes cuentas"
              description="Agrega tu efectivo, cuenta bancaria o tarjeta principal para comenzar a organizar tus movimientos."
              actionLabel="Agregar cuenta"
              onAction={openCreatePanel}
            />
          ) : (
            <section className="grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => {
                const AccountIcon = accountTypeIcons[account.type];
                return (
                  <Card key={account.id} className="grid gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                          <AccountIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-text">{account.name}</h2>
                          <p className="text-sm text-subtle">{accountTypeLabels[account.type]}</p>
                        </div>
                      </div>
                      <Badge tone={account.status === 'active' ? 'income' : 'neutral'}>
                        {account.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-subtle">Balance actual</p>
                      <p className="text-2xl font-semibold text-text">
                        {formatCurrency(account.currentBalance, account.currency)}
                      </p>
                    </div>
                    <p className="min-h-10 text-sm leading-6 text-subtle">{account.description}</p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEditPanel(account)}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Button>
                      {account.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={statusChangingAccountId === account.id}
                          onClick={() => deactivateAccountMutation.mutate(account.id)}
                        >
                          <Power className="h-4 w-4" aria-hidden="true" />
                          {statusChangingAccountId === account.id ? 'Desactivando...' : 'Desactivar'}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={statusChangingAccountId === account.id}
                          onClick={() => reactivateAccountMutation.mutate(account.id)}
                        >
                          <Play className="h-4 w-4" aria-hidden="true" />
                          {statusChangingAccountId === account.id ? 'Reactivando...' : 'Reactivar'}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
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
            if (event.target === event.currentTarget && !saveAccountMutation.isPending) {
              closePanel();
            }
          }}
        >
          <div className="ml-auto grid h-full w-full max-w-xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  {selectedAccount ? 'Editar cuenta' : 'Nueva cuenta'}
                </h2>
                <p className="mt-1 text-sm text-subtle">
                  Define dónde entra, sale o queda apartado tu dinero.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={closePanel}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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
              <Field label="Balance inicial">
                <Input type="number" step="0.01" {...form.register('initialBalance')} />
              </Field>
              <Field label="Descripción">
                <Input placeholder="Uso principal de la cuenta" {...form.register('description')} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closePanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveAccountMutation.isPending}>
                  {saveAccountMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getAccountErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
