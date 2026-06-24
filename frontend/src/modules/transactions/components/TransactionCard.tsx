import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { Transaction } from '../../../types/financial';
import { formatCurrency, formatDate } from '../../../utils/format';
import { transactionCopy, transactionStatusLabels } from '../transactions.constants';
import { formatMovement } from '../transactions.utils';
import { TransactionCategoryIcon } from './TransactionCategoryIcon';

interface TransactionCardProps {
  transaction: Transaction;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionCard({ transaction, isDeleting, onEdit, onDelete }: TransactionCardProps) {
  const copy = transactionCopy[transaction.type];
  const Icon = copy.icon;
  const amountTone =
    transaction.type === 'income'
      ? 'text-positive'
      : transaction.type === 'expense'
        ? 'text-danger'
        : 'text-text';

  return (
    <Card className="px-3 py-2 sm:p-5">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="mt-0.5 rounded-panel bg-muted p-1.5 text-primary sm:p-2">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-text sm:text-base">{transaction.description}</h2>
              <p className="mt-0.5 truncate text-xs text-subtle sm:mt-1 sm:text-sm">{formatMovement(transaction)}</p>
            </div>
            <div className="flex shrink-0 items-start gap-1.5">
              <span className={`pt-0.5 text-right text-sm font-semibold sm:text-base ${amountTone}`}>
                <span className="block">{formatCurrency(transaction.amount, transaction.currency)}</span>
                {transaction.type === 'transfer' && transaction.destinationAmount && transaction.destinationCurrency ? (
                  <span className="block text-xs font-medium text-subtle">
                    {formatCurrency(transaction.destinationAmount, transaction.destinationCurrency)}
                  </span>
                ) : null}
              </span>
              <div className="flex gap-1 sm:hidden">
                <Button className="h-7 w-7 px-0" variant="secondary" size="sm" onClick={onEdit} aria-label="Editar transacción">
                  <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button className="h-7 w-7 px-0" variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete} aria-label="Eliminar transacción">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
            <Badge tone={copy.tone} className="px-2 py-0.5 sm:px-2.5 sm:py-1">{copy.label}</Badge>
            {transaction.type !== 'transfer' ? (
              <Badge tone="neutral" className="max-w-full gap-1 px-2 py-0.5 sm:gap-1.5 sm:px-2.5 sm:py-1">
                <TransactionCategoryIcon transaction={transaction} />
                <span className="truncate">{transaction.category}</span>
              </Badge>
            ) : null}
            <Badge tone="neutral" className="hidden sm:inline-flex">{transactionStatusLabels[transaction.status]}</Badge>
            <Badge tone="neutral" className="hidden sm:inline-flex">{formatDate(transaction.date)}</Badge>
          </div>
          <div className="mt-4 hidden gap-2 sm:flex">
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
