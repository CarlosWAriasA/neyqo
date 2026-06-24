import { ArrowDownRight, ArrowUpRight, PiggyBank, WalletCards } from 'lucide-react';
import type { CurrencySummary } from '../../../api/reports';
import { Card } from '../../../components/ui/card';
import { formatCurrency } from '../../../utils/format';
import { formatSignedPercent } from '../reports.utils';

interface CurrencySummaryCardsProps {
  summary: CurrencySummary;
}

export function CurrencySummaryCards({ summary }: CurrencySummaryCardsProps) {
  const cards = [
    {
      label: 'Ingresos',
      value: formatCurrency(summary.incomeTotal, summary.currency),
      helper: `${formatSignedPercent(summary.previousPeriodComparison.income)} vs. período anterior`,
      icon: ArrowUpRight,
      tone: 'text-positive bg-positive/10',
    },
    {
      label: 'Gastos',
      value: formatCurrency(summary.expenseTotal, summary.currency),
      helper: `${formatSignedPercent(summary.previousPeriodComparison.expenses)} vs. período anterior`,
      icon: ArrowDownRight,
      tone: 'text-danger bg-danger/10',
    },
    {
      label: 'Flujo neto',
      value: formatCurrency(summary.netCashflow, summary.currency),
      helper: `${formatSignedPercent(summary.previousPeriodComparison.netCashflow)} vs. período anterior`,
      icon: WalletCards,
      tone: summary.netCashflow >= 0 ? 'text-positive bg-positive/10' : 'text-warning bg-warning/10',
    },
    {
      label: 'Ahorro',
      value: `${summary.savingsRate}%`,
      helper: summary.topExpenseCategory ? `Mayor gasto: ${summary.topExpenseCategory}` : 'Sin gastos categorizados',
      icon: PiggyBank,
      tone: 'text-primary bg-primary-soft',
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="min-w-0 p-3 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs leading-5 text-subtle sm:text-sm">{card.label}</p>
                <p className="mt-1 break-words text-base font-semibold text-text sm:mt-2 sm:text-2xl">{card.value}</p>
              </div>
              <span className={`hidden rounded-panel p-2 sm:inline-flex ${card.tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 hidden text-sm text-subtle sm:block">{card.helper}</p>
          </Card>
        );
      })}
    </section>
  );
}
