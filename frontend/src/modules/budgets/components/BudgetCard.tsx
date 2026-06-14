import { Edit, Play, Power } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { categoryIconByValue, fallbackCategoryIcon } from '../../../config/categoryIcons';
import type { Budget } from '../../../types/financial';
import { formatCurrency, formatDate } from '../../../utils/format';
import { budgetPeriodCopy, budgetStatusCopy } from '../budgets.constants';

interface BudgetCardProps {
  budget: Budget;
  isChangingStatus: boolean;
  onEdit: () => void;
  onOpenDetail: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

export function BudgetCard({
  budget,
  isChangingStatus,
  onEdit,
  onOpenDetail,
  onDeactivate,
  onReactivate,
}: BudgetCardProps) {
  const status = budgetStatusCopy[budget.status];
  const exceededBy = Math.max(0, budget.spentAmount - budget.maxAmount);

  return (
    <Card className="grid gap-3 p-3 sm:gap-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-text">{budget.name}</h2>
          <p className="mt-1 hidden text-sm text-subtle sm:block">{budget.periodLabel}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="neutral">{budgetPeriodCopy[budget.period]}</Badge>
          <Badge tone={budget.recordStatus === 'active' ? status.tone : 'neutral'}>
            {budget.recordStatus === 'active' ? status.label : 'Inactivo'}
          </Badge>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-subtle">
            {formatCurrency(budget.spentAmount)} de {formatCurrency(budget.maxAmount)}
          </span>
          <span className="font-semibold text-text">{budget.percentageUsed}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted">
          <div
            className={`h-3 rounded-full ${budget.recordStatus === 'active' ? status.bar : 'bg-subtle'}`}
            style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
        <div>
          <p className="text-subtle">Límite</p>
          <p className="font-semibold text-text">{formatCurrency(budget.maxAmount)}</p>
        </div>
        <div>
          <p className="text-subtle">Gastado</p>
          <p className="font-semibold text-text">{formatCurrency(budget.spentAmount)}</p>
        </div>
        <div>
          <p className="text-subtle">Restante</p>
          <p className="font-semibold text-text">{formatCurrency(budget.remainingAmount)}</p>
        </div>
      </div>

      <div className="hidden text-sm sm:block">
        {budget.status === 'exceeded' ? (
          <p className="font-medium text-danger">Excedido por {formatCurrency(exceededBy)}</p>
        ) : (
          <p className="text-subtle">Finaliza el {formatDate(budget.periodEnd)}</p>
        )}
      </div>

      <div className="hidden flex-wrap gap-2 sm:flex">
        {budget.categories.map((category) => {
          const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;

          return (
            <Badge key={category.id} tone="neutral" className="gap-1.5">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {category.name}
            </Badge>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="flex-1 sm:flex-none" variant="secondary" size="sm" onClick={onOpenDetail}>
          Ver detalle
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Editar</span>
        </Button>
        {budget.recordStatus === 'active' ? (
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
