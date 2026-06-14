import { CreditCard } from 'lucide-react';
import { Skeleton } from '../../../components/common/Skeleton';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { Account } from '../../../types/financial';
import { AccountPreview } from './AccountPreview';

interface AccountsOverviewCardProps {
  accounts: Account[];
  loading?: boolean;
  onOpenAccounts: () => void;
}

export function AccountsOverviewCard({ accounts, loading = false, onOpenAccounts }: AccountsOverviewCardProps) {
  return (
    <Card className="sm:min-h-[22rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">Cuentas principales</h2>
          <p className="text-sm text-subtle">Balance por cuenta activa.</p>
        </div>
        <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[4.125rem]" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
          Agrega una cuenta para ver tu balance aquí.
        </p>
      ) : (
        <div className="grid gap-3">
          {accounts.slice(0, 4).map((account) => (
            <AccountPreview key={account.id} account={account} />
          ))}
        </div>
      )}
      <Button variant="secondary" className="mt-4" onClick={onOpenAccounts}>
        Ver cuentas
      </Button>
    </Card>
  );
}
