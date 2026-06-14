import { accountTypeIcons, accountTypeLabels } from '../../../config/navigation';
import type { Account } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';

export function AccountPreview({ account }: { account: Account }) {
  const AccountIcon = accountTypeIcons[account.type];

  return (
    <div className="flex items-center justify-between gap-3 rounded-panel border border-border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <AccountIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{account.name}</p>
          <p className="text-xs text-subtle">{accountTypeLabels[account.type]}</p>
        </div>
      </div>
      <span className="shrink-0 font-semibold text-text">{formatCurrency(account.currentBalance, account.currency)}</span>
    </div>
  );
}
