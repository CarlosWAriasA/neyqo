import { X } from 'lucide-react';
import { DetailListSkeleton } from '../../../components/common/LoadingSkeletons';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { Budget } from '../../../types/financial';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/format';
import { budgetPeriodCopy, budgetStatusCopy } from '../budgets.constants';

interface BudgetDetailDialogProps {
  budget: Budget;
  loading: boolean;
  onClose: () => void;
}

export function BudgetDetailDialog({ budget, loading, onClose }: BudgetDetailDialogProps) {
  const status = budgetStatusCopy[budget.status];
  const currentExpenses = budget.currentExpenses ?? [];
  const periodHistory = budget.periodHistory ?? [];

  return (
    <div
      className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ml-auto grid h-full w-full max-w-3xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{budget.name}</h2>
            <p className="mt-1 text-sm text-subtle">
              {budget.category} · {budgetPeriodCopy[budget.period]} · {formatDate(budget.periodStart)} -{' '}
              {formatDate(budget.periodEnd)}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <Card>
            <p className="text-sm text-subtle">Presupuestado</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.maxAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Consumido</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.spentAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Disponible</p>
            <p className="mt-2 font-semibold text-text">{formatCurrency(budget.remainingAmount)}</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Días restantes</p>
            <p className="mt-2 font-semibold text-text">{budget.daysRemaining}</p>
          </Card>
        </section>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-subtle">Progreso</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div className={`h-3 rounded-full ${status.bar}`} style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }} />
          </div>
        </div>

        <section>
          <h3 className="text-base font-semibold text-text">Gastos incluidos</h3>
          {loading ? <DetailListSkeleton rows={3} /> : null}
          {!loading ? (
            <div className="mt-3 grid gap-2">
              {currentExpenses.length === 0 ? (
              <p className="text-sm text-subtle">No hay gastos en este período.</p>
            ) : (
              currentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 rounded-panel border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium text-text">{expense.description}</p>
                    <p className="text-subtle">
                      {expense.category} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <span className="font-semibold text-text">{formatCurrency(expense.amount)}</span>
                </div>
              ))
            )}
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="text-base font-semibold text-text">Historial de períodos</h3>
          <div className="mt-3 grid gap-2">
            {periodHistory.map((period) => (
              <div key={period.id} className="grid gap-2 rounded-panel border border-border p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-medium text-text">
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </p>
                  <p className="text-subtle">{period.status === 'active' ? 'Activo' : 'Cerrado'}</p>
                </div>
                <span>
                  {formatCurrency(period.spentAmount)} de {formatCurrency(period.budgetedAmount)}
                </span>
                <span className={cn('font-semibold', period.remainingAmount < 0 ? 'text-danger' : 'text-text')}>
                  {formatCurrency(period.remainingAmount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
