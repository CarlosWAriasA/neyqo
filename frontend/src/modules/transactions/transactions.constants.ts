import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '../../types/financial';

export const transactionCopy = {
  income: { label: 'Ingreso', tone: 'income' as const, icon: ArrowUpRight },
  expense: { label: 'Gasto', tone: 'expense' as const, icon: ArrowDownRight },
  transfer: { label: 'Transferencia', tone: 'transfer' as const, icon: ArrowLeftRight },
} satisfies Record<Transaction['type'], { label: string; tone: 'income' | 'expense' | 'transfer'; icon: typeof ArrowUpRight }>;

export const transactionStatusLabels = {
  completed: 'Completada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
} satisfies Record<Transaction['status'], string>;
