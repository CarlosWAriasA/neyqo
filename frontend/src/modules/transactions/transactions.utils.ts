import type { AxiosError } from 'axios';
import type { TransactionPayload } from '../../api/financial';
import type { Transaction } from '../../types/financial';
import type { TransactionFormSubmitValues, TransactionFormValues } from './transactions.schema';

export function toTransactionPayload(values: TransactionFormSubmitValues): TransactionPayload {
  return {
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
}

export function toTransactionFormValues(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: transaction.amount,
    sourceAccountId: transaction.sourceAccountId ?? '',
    destinationAccountId: transaction.destinationAccountId ?? '',
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

export function getTransactionErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
