import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { Transaction } from '../../../types/financial';
import { formatCurrency, formatDate } from '../../../utils/format';
import { transactionCopy } from '../transactions.constants';
import { formatMovement } from '../transactions.utils';
import { TransactionCategoryIcon } from './TransactionCategoryIcon';

interface TransactionRowProps {
  transaction: Transaction;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({ transaction, isDeleting, onEdit, onDelete }: TransactionRowProps) {
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
