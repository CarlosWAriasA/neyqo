import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createAccount,
  deactivateAccount,
  reactivateAccount,
  updateAccount,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { CardGridSkeleton, StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAccounts } from '../../features/finance/hooks';
import { financeQueryKeys } from '../../features/finance/queryKeys';
import type { Account } from '../../types/financial';
import { formatCurrency } from '../../utils/format';
import { AccountCard } from './components/AccountCard';
import { AccountPanel } from './components/AccountPanel';
import {
  accountSchema,
  emptyAccountValues,
  type AccountFormSubmitValues,
  type AccountFormValues,
} from './accounts.schema';
import { getAccountErrorMessage, toAccountFormValues, toAccountPayload } from './accounts.utils';

export function AccountsPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [statusChangingAccountId, setStatusChangingAccountId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const accountsQuery = useAccounts();
  const accounts = accountsQuery.data ?? [];
  const totalBalance = accounts.reduce((total, account) => total + account.currentBalance, 0);
  const activeAccounts = accounts.filter((account) => account.status === 'active').length;
  const form = useForm<AccountFormValues, unknown, AccountFormSubmitValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: emptyAccountValues,
  });

  const saveAccountMutation = useMutation({
    mutationFn: (values: AccountFormSubmitValues) => {
      const payload = toAccountPayload(values);
      return selectedAccount ? updateAccount(selectedAccount.id, payload) : createAccount(payload);
    },
    onSuccess: async () => {
      toast.success(selectedAccount ? 'Cuenta actualizada.' : 'Cuenta creada.');
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.accounts });
      closePanel();
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos guardar la cuenta. Revisa los datos e intenta nuevamente.'));
    },
  });

  const deactivateAccountMutation = useMutation({
    mutationFn: deactivateAccount,
    onMutate: (accountId) => setStatusChangingAccountId(accountId),
    onSuccess: async () => {
      toast.success('Cuenta desactivada.');
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.accounts });
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos desactivar la cuenta. Intenta nuevamente.'));
    },
    onSettled: () => setStatusChangingAccountId(null),
  });

  const reactivateAccountMutation = useMutation({
    mutationFn: reactivateAccount,
    onMutate: (accountId) => setStatusChangingAccountId(accountId),
    onSuccess: async () => {
      toast.success('Cuenta reactivada.');
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.accounts });
    },
    onError: (error) => {
      toast.error(getAccountErrorMessage(error, 'No pudimos reactivar la cuenta. Intenta nuevamente.'));
    },
    onSettled: () => setStatusChangingAccountId(null),
  });

  function openCreatePanel() {
    setSelectedAccount(null);
    form.reset(emptyAccountValues);
    setPanelOpen(true);
  }

  function openEditPanel(account: Account) {
    setSelectedAccount(account);
    form.reset(toAccountFormValues(account));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedAccount(null);
    form.reset(emptyAccountValues);
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

      {accountsQuery.isLoading ? (
        <StatGridSkeleton />
      ) : (
        <section className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Balance</p>
            <p className="mt-1 text-base font-semibold text-text sm:mt-2 sm:text-2xl">{formatCurrency(totalBalance)}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Activas</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{activeAccounts}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Moneda</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">DOP</p>
          </Card>
        </section>
      )}

      {accountsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar tus cuentas"
          description="Reintenta para volver a sincronizar esta vista."
          onRetry={() => void accountsQuery.refetch()}
        />
      ) : null}

      <div className="rounded-panel border border-border bg-surface/40 p-3 lg:min-h-0 lg:flex-1">
        <div className="category-scrollbar max-h-[68vh] overflow-y-auto pr-2 lg:h-full lg:max-h-none">
          {accountsQuery.isLoading ? <CardGridSkeleton variant="standard" /> : null}

          {!accountsQuery.isLoading && !accountsQuery.isError && accounts.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Aún no tienes cuentas"
              description="Agrega tu efectivo, cuenta bancaria o tarjeta principal para comenzar a organizar tus movimientos."
              actionLabel="Agregar cuenta"
              onAction={openCreatePanel}
            />
          ) : null}

          {accounts.length > 0 ? (
            <section className="grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isChangingStatus={statusChangingAccountId === account.id}
                  onEdit={() => openEditPanel(account)}
                  onDeactivate={() => deactivateAccountMutation.mutate(account.id)}
                  onReactivate={() => reactivateAccountMutation.mutate(account.id)}
                />
              ))}
            </section>
          ) : null}
        </div>
      </div>

      {panelOpen ? (
        <AccountPanel
          form={form}
          selectedAccount={selectedAccount}
          saving={saveAccountMutation.isPending}
          onClose={closePanel}
          onSubmit={(values) => saveAccountMutation.mutate(values)}
        />
      ) : null}
    </div>
  );
}
