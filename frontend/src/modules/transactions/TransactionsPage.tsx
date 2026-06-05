import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createTransaction,
  deleteTransaction,
  getAccounts,
  getCategories,
  getTransactions,
  updateTransaction,
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
import { categoryIconByValue, fallbackCategoryIcon } from '../../config/categoryIcons';
import type { Category, Transaction } from '../../types/financial';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';

const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
    sourceAccountId: z.string().min(1, 'Selecciona una cuenta origen.'),
    destinationAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().min(2, 'Agrega una descripción.'),
    date: z.string().min(1, 'Selecciona una fecha.'),
    status: z.enum(['completed', 'pending', 'cancelled']),
    note: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === 'transfer') {
      if (!value.destinationAccountId) {
        context.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'Selecciona una cuenta destino.',
        });
      }

      if (value.destinationAccountId && value.destinationAccountId === value.sourceAccountId) {
        context.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'La cuenta destino debe ser diferente.',
        });
      }

      return;
    }

    if (!value.categoryId) {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Selecciona una categoría.',
      });
    }
  });

type TransactionFormValues = z.input<typeof transactionSchema>;
type TransactionFormSubmitValues = z.output<typeof transactionSchema>;
type TransactionTypeFilter = 'all' | Transaction['type'];
type TransactionStatusFilter = 'all' | Transaction['status'];

const emptyTransactionValues: TransactionFormValues = {
  type: 'expense',
  amount: 0,
  sourceAccountId: '',
  destinationAccountId: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'completed',
  note: '',
};

const transactionCopy = {
  income: { label: 'Ingreso', tone: 'income' as const, icon: ArrowUpRight },
  expense: { label: 'Gasto', tone: 'expense' as const, icon: ArrowDownRight },
  transfer: { label: 'Transferencia', tone: 'transfer' as const, icon: ArrowLeftRight },
};

const statusLabels = {
  completed: 'Completada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
} satisfies Record<Transaction['status'], string>;

export function TransactionsPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const categorySelectRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const form = useForm<TransactionFormValues, unknown, TransactionFormSubmitValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: emptyTransactionValues,
  });
  const amountField = form.register('amount');
  const selectedType = form.watch('type');
  const activeAccounts = (accountsQuery.data ?? []).filter((account) => account.status === 'active');
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.status === 'active' && category.type === selectedType,
  );
  const selectedCategory = activeCategories.find((category) => category.id === form.watch('categoryId'));

  const transactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (transactionsQuery.data ?? []).filter((transaction) => {
      const searchableText = [
        transaction.description,
        transaction.category ?? 'Transferencia',
        transaction.sourceAccount,
        transaction.destinationAccount ?? '',
        transaction.note ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesText = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesDateFrom = !dateFrom || transaction.date >= dateFrom;
      const matchesDateTo = !dateTo || transaction.date <= dateTo;

      return matchesText && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [transactionsQuery.data, query, typeFilter, statusFilter, dateFrom, dateTo]);

  const saveTransactionMutation = useMutation({
    mutationFn: (values: TransactionFormSubmitValues) => {
      const payload = {
        type: values.type,
        amount: values.amount,
        sourceAccountId: values.sourceAccountId,
        destinationAccountId: values.type === 'transfer' ? values.destinationAccountId : undefined,
        categoryId: values.type === 'transfer' ? undefined : values.categoryId,
        description: values.description.trim(),
        date: values.date,
        status: values.status,
        note: values.note?.trim() || undefined,
      };

      return selectedTransaction
        ? updateTransaction(selectedTransaction.id, payload)
        : createTransaction(payload);
    },
    onSuccess: async () => {
      toast.success(selectedTransaction ? 'Transacción actualizada.' : 'Transacción registrada.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      ]);
      closePanel();
    },
    onError: (error) => {
      toast.error(getTransactionErrorMessage(error, 'No pudimos guardar la transacción.'));
    },
  });

  useEffect(() => {
    if (!panelOpen || selectedTransaction) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [panelOpen, selectedTransaction]);

  useEffect(() => {
    if (!categorySelectOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!categorySelectRef.current?.contains(event.target as Node)) {
        setCategorySelectOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [categorySelectOpen]);

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      toast.success('Transacción eliminada.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      ]);
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
    form.reset({
      type: transaction.type,
      amount: transaction.amount,
      sourceAccountId: transaction.sourceAccountId ?? '',
      destinationAccountId: transaction.destinationAccountId ?? '',
      categoryId: transaction.categoryId ?? '',
      description: transaction.description,
      date: transaction.date,
      status: transaction.status,
      note: transaction.note ?? '',
    });
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedTransaction(null);
    setCategorySelectOpen(false);
    form.reset(emptyTransactionValues);
  }

  function handleTypeChange(type: Transaction['type']) {
    form.setValue('type', type, { shouldDirty: true, shouldValidate: true });
    form.setValue('categoryId', '', { shouldDirty: true });
    form.setValue('destinationAccountId', '', { shouldDirty: true });
    setCategorySelectOpen(false);
  }

  function selectCategory(categoryId: string) {
    form.setValue('categoryId', categoryId, { shouldDirty: true, shouldValidate: true });
    setCategorySelectOpen(false);
  }

  function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(`¿Eliminar "${transaction.description}"? El balance se ajustará automáticamente.`);

    if (confirmed) {
      deleteTransactionMutation.mutate(transaction.id);
    }
  }

  function handleSubmit(values: TransactionFormSubmitValues) {
    saveTransactionMutation.mutate(values);
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
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_170px_170px]">
          <label className="relative">
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

      {!transactionsQuery.isError && transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No hay transacciones en esta vista"
          description="Registra un ingreso, gasto o transferencia para mantener tus balances al día."
          actionLabel="Registrar transacción"
          onAction={() => openCreatePanel()}
        />
      ) : (
        <>
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
        </>
      )}

      {panelOpen ? (
        <div
          className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saveTransactionMutation.isPending) {
              closePanel();
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
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={closePanel}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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
                      open={categorySelectOpen}
                      containerRef={categorySelectRef}
                      selectedCategory={selectedCategory}
                      onOpenChange={setCategorySelectOpen}
                      onSelect={selectCategory}
                    />
                  </Field>
                )}
              </div>

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
                <Button type="button" variant="secondary" onClick={closePanel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveTransactionMutation.isPending}>
                  {saveTransactionMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const copy = transactionCopy[transaction.type];

  return (
    <tr className="border-t border-border">
      <td className="px-5 py-4">
        <Badge tone={copy.tone}>{copy.label}</Badge>
      </td>
      <td className="px-5 py-4 font-medium text-text">{transaction.description}</td>
      <td className="px-5 py-4 text-subtle">{formatMovement(transaction)}</td>
      <td className="px-5 py-4 text-subtle">
        <CategoryLabel transaction={transaction} />
      </td>
      <td className="px-5 py-4 text-subtle">{formatDate(transaction.date)}</td>
      <td className="px-5 py-4 text-right font-semibold text-text">
        {formatCurrency(transaction.amount, transaction.currency)}
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const copy = transactionCopy[transaction.type];
  const Icon = copy.icon;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="rounded-panel bg-muted p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-text">{transaction.description}</h2>
              <p className="mt-1 text-sm text-subtle">{formatMovement(transaction)}</p>
            </div>
            <span className="shrink-0 font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={copy.tone}>{copy.label}</Badge>
            {transaction.type !== 'transfer' ? (
              <Badge tone="neutral" className="gap-1.5">
                <TransactionCategoryIcon transaction={transaction} />
                {transaction.category}
              </Badge>
            ) : null}
            <Badge tone="neutral">{statusLabels[transaction.status]}</Badge>
            <Badge tone="neutral">{formatDate(transaction.date)}</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function formatMovement(transaction: Transaction) {
  if (transaction.type === 'transfer') {
    return `${transaction.sourceAccount} -> ${transaction.destinationAccount ?? 'Destino pendiente'}`;
  }

  return transaction.sourceAccount;
}

function TransactionCategoryIcon({ transaction }: { transaction: Transaction }) {
  const Icon = transaction.categoryIcon
    ? categoryIconByValue[transaction.categoryIcon] ?? fallbackCategoryIcon
    : fallbackCategoryIcon;

  return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
}

function CategorySelect({
  categories,
  open,
  containerRef,
  selectedCategory,
  onOpenChange,
  onSelect,
}: {
  categories: Category[];
  open: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  selectedCategory?: Category;
  onOpenChange: (open: boolean) => void;
  onSelect: (categoryId: string) => void;
}) {
  const SelectedIcon = selectedCategory
    ? categoryIconByValue[selectedCategory.icon] ?? fallbackCategoryIcon
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between gap-3 rounded-panel border border-border bg-surface px-3 text-left text-sm text-text outline-none transition hover:bg-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {SelectedIcon ? <SelectedIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          <span className={cn('truncate', !selectedCategory && 'text-subtle')}>
            {selectedCategory?.name ?? 'Seleccionar categoría'}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
      </button>

      {open ? (
        <div className="category-scrollbar absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-panel border border-border bg-surface p-2 shadow-panel">
          {categories.map((category) => {
            const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;
            const selected = selectedCategory?.id === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-3 rounded-panel px-3 text-left text-sm transition hover:bg-muted',
                  selected && 'bg-primary-soft text-primary',
                )}
                onClick={() => onSelect(category.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate font-medium">{category.name}</span>
                </span>
                {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CategoryLabel({ transaction }: { transaction: Transaction }) {
  if (transaction.type === 'transfer') {
    return <span>Transferencia</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <TransactionCategoryIcon transaction={transaction} />
      {transaction.category}
    </span>
  );
}

function getTransactionErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
