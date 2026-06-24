import type { BudgetPerformanceItem } from '../../../api/reports';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { Card } from '../../../components/ui/card';
import type { CurrencyCode } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';

interface BudgetPerformanceCardProps {
  currency: CurrencyCode;
  budgets: BudgetPerformanceItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

const statusLabel = {
  normal: 'En ritmo',
  'moderate-warning': 'Cerca',
  'important-warning': 'Muy cerca',
  exceeded: 'Excedido',
};

const statusClass = {
  normal: 'bg-positive',
  'moderate-warning': 'bg-warning',
  'important-warning': 'bg-warning',
  exceeded: 'bg-danger',
};

export function BudgetPerformanceCard({ currency, budgets, loading, error, onRetry }: BudgetPerformanceCardProps) {
  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="text-base font-semibold text-text">Presupuestos</h2>
        <p className="mt-1 text-sm text-subtle">Límites activos comparados contra los gastos del rango en {currency}.</p>
      </div>

      {error ? (
        <ErrorState title="No pudimos cargar presupuestos" description="Reintenta para actualizar esta sección." onRetry={onRetry} />
      ) : null}

      {!error && loading ? <div className="h-64 animate-pulse rounded-panel bg-muted" /> : null}

      {!error && !loading && budgets.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border p-6 text-sm text-subtle">
          No hay presupuestos activos para mostrar en esta moneda.
        </div>
      ) : null}

      {!error && !loading && budgets.length > 0 ? (
        <div className="grid gap-3">
          {budgets.slice(0, 6).map((budget) => (
            <article key={`${budget.budgetId}-${budget.currency}`} className="rounded-panel border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-text">{budget.budgetName}</h3>
                  <p className="mt-1 text-xs text-subtle">{budget.categoryNames.join(', ') || 'Sin categoría'}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-xs font-medium text-subtle">
                  {statusLabel[budget.status]}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${statusClass[budget.status]}`}
                  style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-subtle">
                <span>{formatCurrency(budget.spentAmount, currency)} usados</span>
                <span>{formatCurrency(budget.remainingAmount, currency)} disponibles</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
