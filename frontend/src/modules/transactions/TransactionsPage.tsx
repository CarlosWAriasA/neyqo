import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { InfiniteListBoundary } from '../../components/common/InfiniteListBoundary';
import { TransactionListSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import {
  invalidateFinanceAfterTransactionChange,
  useAccounts,
  useCategories,
  useInfiniteTransactions,
} from '../../features/finance/hooks';
import { flattenPages } from '../../features/finance/pagination';
import type { Transaction } from '../../types/financial';
import { TransactionCard } from './components/TransactionCard';
import { TransactionPanel } from './components/TransactionPanel';
import { TransactionRow } from './components/TransactionRow';
import {
  emptyTransactionValues,
  transactionSchema,
  type TransactionFormSubmitValues,
  type TransactionFormValues,
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from './transactions.schema';
import {
  getTransactionErrorMessage,
  toTransactionFormValues,
  toTransactionPayload,
} from './transactions.utils';

export function TransactionsPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const queryClient = useQueryClient();
  const transactionsQuery = useInfiniteTransactions({
    query: query.trim() || undefined,
    type: typeFilter,
    status: statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const form = useForm<TransactionFormValues, unknown, TransactionFormSubmitValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: emptyTransactionValues,
  });
  const selectedType = form.watch('type');
  const selectedCategoryId = form.watch('categoryId');
  const activeAccounts = (accountsQuery.data ?? []).filter((account) => account.status === 'active');
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.status === 'active' && category.type === selectedType,
  );
  const transactions = flattenPages(transactionsQuery.data?.pages);

  const saveTransactionMutation = useMutation({
    mutationFn: (values: TransactionFormSubmitValues) => {
      const payload = toTransactionPayload(values);
      return selectedTransaction
        ? updateTransaction(selectedTransaction.id, payload)
        : createTransaction(payload);
    },
    onSuccess: async () => {
      toast.success(selectedTransaction ? 'Transacción actualizada.' : 'Transacción registrada.');
      await invalidateFinanceAfterTransactionChange(queryClient);
      closePanel();
    },
    onError: (error) => {
      toast.error(getTransactionErrorMessage(error, 'No pudimos guardar la transacción.'));
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      toast.success('Transacción eliminada.');
      await invalidateFinanceAfterTransactionChange(queryClient);
    },
    onError: (error) => {
      toast.error(getTransactionErrorMessage(error, 'No pudimos eliminar la transacción.'));
    },
  });

  function openCreatePanel(type: Transaction['type'] = 'expense') {
    setSelectedTransaction(null);
    form.reset({ ...emptyTransactionValues, type });
    setPanelOpen(true);
  }

  function openEditPanel(transaction: Transaction) {
    setSelectedTransaction(transaction);
    form.reset(toTransactionFormValues(transaction));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedTransaction(null);
    form.reset(emptyTransactionValues);
  }

  function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(`¿Eliminar "${transaction.description}"? El balance se ajustará automáticamente.`);

    if (confirmed) {
      deleteTransactionMutation.mutate(transaction.id);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Transacciones"
        description="Registra ingresos, gastos y transferencias con filtros claros para encontrar cada movimiento."
        actions={
          <Button onClick={() => openCreatePanel()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Registrar transacción
          </Button>
        }
      />

      <Card className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_180px_180px_170px_170px]">
          <label className="relative col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" aria-hidden="true" />
            <Input
              className="pl-9"
              placeholder="Buscar por descripción, cuenta o categoría"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TransactionTypeFilter)}>
            <option value="all">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
            <option value="transfer">Transferencias</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TransactionStatusFilter)}>
            <option value="all">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </Select>
          <Input type="date" aria-label="Filtrar desde" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" aria-label="Filtrar hasta" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </Card>

      {transactionsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar tus transacciones"
          description="Reintenta para volver a sincronizar esta vista."
          onRetry={() => void transactionsQuery.refetch()}
        />
      ) : null}

      {transactionsQuery.isLoading ? <TransactionListSkeleton /> : null}

      {!transactionsQuery.isLoading && !transactionsQuery.isError && transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No hay transacciones en esta vista"
          description="Registra un ingreso, gasto o transferencia para mantener tus balances al día."
          actionLabel="Registrar transacción"
          onAction={() => openCreatePanel()}
        />
      ) : null}

      {transactions.length > 0 ? (
        <InfiniteListBoundary
          hasNextPage={Boolean(transactionsQuery.hasNextPage)}
          isFetchingNextPage={transactionsQuery.isFetchingNextPage}
          onLoadMore={() => void transactionsQuery.fetchNextPage()}
        >
          <Card className="hidden overflow-hidden p-0 lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium">Movimiento</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => openEditPanel(transaction)}
                    onDelete={() => handleDelete(transaction)}
                    isDeleting={deleteTransactionMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </Card>

          <section className="grid gap-3 lg:hidden">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={() => openEditPanel(transaction)}
                onDelete={() => handleDelete(transaction)}
                isDeleting={deleteTransactionMutation.isPending}
              />
            ))}
          </section>
        </InfiniteListBoundary>
      ) : null}

      {panelOpen ? (
        <TransactionPanel
          form={form}
          selectedTransaction={selectedTransaction}
          selectedType={selectedType}
          selectedCategoryId={selectedCategoryId ?? ''}
          activeAccounts={activeAccounts}
          activeCategories={activeCategories}
          saving={saveTransactionMutation.isPending}
          onClose={closePanel}
          onSubmit={(values) => saveTransactionMutation.mutate(values)}
        />
      ) : null}
    </div>
  );
}
