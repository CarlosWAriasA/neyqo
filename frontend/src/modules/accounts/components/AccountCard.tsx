import { Edit, Play, Power } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { accountTypeIcons, accountTypeLabels } from '../../../config/navigation';
import type { Account } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';

interface AccountCardProps {
  account: Account;
  isChangingStatus: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

export function AccountCard({
  account,
  isChangingStatus,
  onEdit,
  onDeactivate,
  onReactivate,
}: AccountCardProps) {
  const AccountIcon = accountTypeIcons[account.type];

  return (
    <Card className="grid gap-3 p-3 sm:gap-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary sm:h-10 sm:w-10">
            <AccountIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-text">{account.name}</h2>
            <p className="text-sm text-subtle">{accountTypeLabels[account.type]}</p>
            {account.institutionName || account.lastFour ? (
              <p className="mt-0.5 truncate text-xs text-subtle">
                {[account.institutionName, account.lastFour ? `•••• ${account.lastFour}` : undefined]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
        <Badge tone={account.status === 'active' ? 'income' : 'neutral'}>
          {account.status === 'active' ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      <div>
        <p className="text-xs text-subtle sm:text-sm">Balance actual</p>
        <p className="text-lg font-semibold text-text sm:text-2xl">
          {formatCurrency(account.currentBalance, account.currency)}
        </p>
      </div>
      <p className="hidden min-h-10 text-sm leading-6 text-subtle sm:block">{account.description}</p>
      <div className="flex gap-2">
        <Button className="flex-1 sm:flex-none" variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
        {account.status === 'active' ? (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onDeactivate}>
            <Power className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{isChangingStatus ? 'Desactivando...' : 'Desactivar'}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onReactivate}>
            <Play className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{isChangingStatus ? 'Reactivando...' : 'Reactivar'}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
