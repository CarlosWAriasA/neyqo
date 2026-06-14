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

  return (
    <Card className="p-3 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-panel bg-muted p-2 text-primary">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-text">{transaction.description}</h2>
              <p className="mt-1 text-sm text-subtle">{formatMovement(transaction)}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold sm:text-base">{formatCurrency(transaction.amount, transaction.currency)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={copy.tone}>{copy.label}</Badge>
            {transaction.type !== 'transfer' ? (
              <Badge tone="neutral" className="gap-1.5">
                <TransactionCategoryIcon transaction={transaction} />
                {transaction.category}
              </Badge>
            ) : null}
            <Badge tone="neutral" className="hidden sm:inline-flex">{transactionStatusLabels[transaction.status]}</Badge>
            <Badge tone="neutral">{formatDate(transaction.date)}</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1 sm:flex-none" variant="secondary" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Eliminar</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
