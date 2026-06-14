import { WalletCards } from 'lucide-react';
import { EmptyState } from '../../../components/common/EmptyState';
import { Skeleton } from '../../../components/common/Skeleton';
import { Card } from '../../../components/ui/card';
import type { Transaction } from '../../../types/financial';
import { TransactionPreview } from './TransactionPreview';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  loading?: boolean;
  onCreateTransaction: () => void;
}

export function RecentTransactionsCard({ transactions, loading = false, onCreateTransaction }: RecentTransactionsCardProps) {
  return (
    <Card className="sm:min-h-[27rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">Últimas transacciones</h2>
          <p className="text-sm text-subtle">Movimientos recientes registrados en tus cuentas.</p>
        </div>
        <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[4.375rem]" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title="Aún no hay transacciones"
          description="Registra tu primer ingreso o gasto para empezar a leer tu flujo del mes."
          actionLabel="Registrar movimiento"
          onAction={onCreateTransaction}
        />
      ) : (
        <div className="grid gap-3">
          {transactions.map((transaction) => (
            <TransactionPreview key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </Card>
  );
}
