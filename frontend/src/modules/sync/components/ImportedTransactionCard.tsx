import { Ban, RotateCcw, WalletCards } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { ImportedTransaction } from '../../../types/financial';
import { formatCurrency, formatDate } from '../../../utils/format';
import {
  bankLabels,
  importedTransactionEventLabels,
  importedTransactionStatusLabels,
} from '../sync.constants';

interface ImportedTransactionCardProps {
  transaction: ImportedTransaction;
  changing: boolean;
  onIgnore: () => void;
  onReopen: () => void;
}

export function ImportedTransactionCard({
  transaction,
  changing,
  onIgnore,
  onReopen,
}: ImportedTransactionCardProps) {
  const ignored = transaction.status === 'ignored';
  const needsReview = transaction.status === 'needs_review';

  return (
    <Card className="grid min-w-0 gap-3 p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
            <WalletCards className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-text">{transaction.merchant}</h3>
            <p className="mt-0.5 truncate text-xs text-subtle">
              {bankLabels[transaction.bankCode]} · {importedTransactionEventLabels[transaction.eventType]}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold text-danger">{formatCurrency(transaction.amount, transaction.currency)}</p>
          <p className="text-xs text-subtle">{formatDate(transaction.transactionDate)}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge tone={needsReview ? 'warning' : ignored ? 'neutral' : 'income'}>
          {importedTransactionStatusLabels[transaction.status]}
        </Badge>
        {transaction.cardLastDigits ? <Badge tone="neutral">**** {transaction.cardLastDigits}</Badge> : null}
        <span className="text-xs text-subtle">{Math.round(transaction.confidence * 100)}% confianza</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="min-w-0 rounded-panel bg-muted px-3 py-2">
          <p className="text-xs text-subtle">Cuenta</p>
          <p className="truncate font-medium text-text">{transaction.accountName ?? 'Sin asociar'}</p>
        </div>
        <div className="min-w-0 rounded-panel bg-muted px-3 py-2">
          <p className="text-xs text-subtle">Categoría</p>
          <p className="truncate font-medium text-text">{transaction.categoryName ?? 'Sin asociar'}</p>
        </div>
      </div>

      {transaction.reviewNote ? <p className="text-xs leading-5 text-subtle">{transaction.reviewNote}</p> : null}

      <div className="flex gap-2">
        {ignored ? (
          <Button type="button" variant="secondary" size="sm" onClick={onReopen} disabled={changing}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Revisar
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={onIgnore} disabled={changing}>
            <Ban className="h-4 w-4" aria-hidden="true" />
            Ignorar
          </Button>
        )}
      </div>
    </Card>
  );
}
