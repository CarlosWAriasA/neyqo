import { categoryIconByValue, fallbackCategoryIcon } from '../../../config/categoryIcons';
import type { Transaction } from '../../../types/financial';

export function TransactionCategoryIcon({ transaction }: { transaction: Transaction }) {
  const Icon = transaction.categoryIcon
    ? categoryIconByValue[transaction.categoryIcon] ?? fallbackCategoryIcon
    : fallbackCategoryIcon;

  return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
}
