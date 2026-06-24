import { ListChecks } from 'lucide-react';
import { Skeleton } from '../../../components/common/Skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { Budget } from '../../../types/financial';
import { cn } from '../../../utils/cn';
import { formatCurrency } from '../../../utils/format';
import type { BudgetSummary } from '../dashboard.utils';

interface BudgetOverviewCardProps {
  summary: BudgetSummary;
  warningBudgets: Budget[];
  loading?: boolean;
  onOpenBudgets: () => void;
}

export function BudgetOverviewCard({ summary, warningBudgets, loading = false, onOpenBudgets }: BudgetOverviewCardProps) {
  return (
    <Card className="sm:min-h-[27rem]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">Presupuestos</h2>
          <p className="mt-1 text-sm text-subtle">
            {formatCurrency(summary.totalSpent)} usados de {formatCurrency(summary.totalBudgeted)}
          </p>
        </div>
        <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {loading ? (
        <>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="mt-3 h-4 w-4/5 max-w-48" />
          <div className="mt-5 grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[4.25rem]" />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={cn(
                'h-2 rounded-full',
                summary.percentageUsed >= 100
                  ? 'bg-danger'
                  : summary.percentageUsed >= 75
                    ? 'bg-warning'
                    : 'bg-positive',
              )}
              style={{ width: `${Math.min(summary.percentageUsed, 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-subtle">
            {summary.nearLimitCount} cerca del límite · {summary.exceededCount} excedido{summary.exceededCount === 1 ? '' : 's'}
          </p>
          <div className="mt-5 grid gap-4">
            {warningBudgets.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
            Tus presupuestos activos están dentro del rango esperado.
          </p>
            ) : (
              warningBudgets.map((budget) => (
                <button
                  key={budget.id}
                  type="button"
                  className="rounded-panel border border-border p-3 text-left transition hover:border-primary/40 hover:bg-muted"
                  onClick={onOpenBudgets}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-text">{budget.name}</span>
                    <Badge tone={budget.status === 'exceeded' ? 'expense' : 'warning'}>{budget.percentageUsed}%</Badge>
                  </div>
                  <p className="text-xs text-subtle">Restante: {formatCurrency(budget.remainingAmount)}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
      <Button variant="secondary" className="mt-4" onClick={onOpenBudgets}>
        Ver presupuestos
      </Button>
    </Card>
  );
}
