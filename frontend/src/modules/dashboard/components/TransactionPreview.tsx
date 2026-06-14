import { Badge } from '../../../components/ui/badge';
import type { Transaction } from '../../../types/financial';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/format';

export function TransactionPreview({ transaction }: { transaction: Transaction }) {
  const copy = {
    income: { label: 'Ingreso', tone: 'income' as const, sign: '+', className: 'text-positive' },
    expense: { label: 'Gasto', tone: 'expense' as const, sign: '-', className: 'text-danger' },
    transfer: { label: 'Transferencia', tone: 'transfer' as const, sign: '', className: 'text-text' },
  }[transaction.type];

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-text">{transaction.description}</p>
        <p className="text-sm text-subtle">
          {transaction.category ?? transaction.destinationAccount ?? 'Transferencia'} · {formatDate(transaction.date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={copy.tone}>{copy.label}</Badge>
        <span className={cn('font-semibold', copy.className)}>
          {copy.sign ? `${copy.sign} ` : ''}
          {formatCurrency(transaction.amount, transaction.currency)}
        </span>
      </div>
    </div>
  );
}
