import type { AxiosError } from 'axios';
import type { TransactionPayload } from '../../api/financial';
import type { CurrencyCode, Transaction } from '../../types/financial';
import type { TransactionFormSubmitValues, TransactionFormValues } from './transactions.schema';

export interface TransactionDateGroup {
  key: string;
  title: string;
  subtitle: string;
  transactions: Transaction[];
  summary: {
    count: number;
    income: Partial<Record<CurrencyCode, number>>;
    expense: Partial<Record<CurrencyCode, number>>;
  };
}

export function toTransactionPayload(values: TransactionFormSubmitValues): TransactionPayload {
  return {
    type: values.type,
    amount: values.amount,
    sourceAccountId: values.sourceAccountId,
    destinationAccountId: values.type === 'transfer' ? values.destinationAccountId : undefined,
    destinationAmount: values.type === 'transfer' ? values.destinationAmount : undefined,
    categoryId: values.type === 'transfer' ? undefined : values.categoryId,
    description: values.description.trim(),
    date: values.date,
    status: values.status,
    note: values.note?.trim() || undefined,
  };
}

export function toTransactionFormValues(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: transaction.amount,
    sourceAccountId: transaction.sourceAccountId ?? '',
    destinationAccountId: transaction.destinationAccountId ?? '',
    destinationAmount: transaction.destinationAmount,
    categoryId: transaction.categoryId ?? '',
    description: transaction.description,
    date: transaction.date,
    status: transaction.status,
    note: transaction.note ?? '',
  };
}

export function formatMovement(transaction: Transaction) {
  if (transaction.type === 'transfer') {
    return `${transaction.sourceAccount} -> ${transaction.destinationAccount ?? 'Destino pendiente'}`;
  }

  return transaction.sourceAccount;
}

export function groupTransactionsByDate(transactions: Transaction[]): TransactionDateGroup[] {
  const groups = new Map<string, TransactionDateGroup>();

  transactions.forEach((transaction) => {
    const key = getDateKey(transaction.date);
    const group = groups.get(key) ?? {
      key,
      title: formatRelativeDateTitle(key),
      subtitle: formatDateSubtitle(key),
      transactions: [],
      summary: {
        count: 0,
        income: {},
        expense: {},
      },
    };

    group.transactions.push(transaction);
    group.summary.count += 1;

    if (transaction.type === 'income') {
      addCurrencyAmount(group.summary.income, transaction.currency ?? 'DOP', transaction.amount);
    }

    if (transaction.type === 'expense') {
      addCurrencyAmount(group.summary.expense, transaction.currency ?? 'DOP', transaction.amount);
    }

    groups.set(key, group);
  });

  return Array.from(groups.values());
}

export function formatCurrencySummary(summary: Partial<Record<CurrencyCode, number>>) {
  return Object.entries(summary) as Array<[CurrencyCode, number]>;
}

function addCurrencyAmount(
  summary: Partial<Record<CurrencyCode, number>>,
  currency: CurrencyCode,
  amount: number,
) {
  summary[currency] = (summary[currency] ?? 0) + amount;
}

function getDateKey(value: string) {
  const dateOnlyMatch = value.match(/^\d{4}-\d{2}-\d{2}/);

  if (dateOnlyMatch) {
    return dateOnlyMatch[0];
  }

  return toDateKey(new Date(value));
}

function formatRelativeDateTitle(dateKey: string) {
  const today = startOfDay(new Date());
  const date = parseDateKey(dateKey);
  const diffInDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);

  if (diffInDays === 0) {
    return 'Hoy';
  }

  if (diffInDays === 1) {
    return 'Ayer';
  }

  if (diffInDays > 1 && diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  }

  if (diffInDays >= 7 && diffInDays < 14) {
    return 'Hace una semana';
  }

  if (diffInDays >= 14 && diffInDays < 30) {
    return `Hace ${Math.floor(diffInDays / 7)} semanas`;
  }

  if (diffInDays >= 30 && diffInDays < 60) {
    return 'Hace un mes';
  }

  if (diffInDays >= 60 && diffInDays < 365) {
    return `Hace ${Math.floor(diffInDays / 30)} meses`;
  }

  return formatDateSubtitle(dateKey);
}

function formatDateSubtitle(dateKey: string) {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(dateKey));
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTransactionErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
