import { ArrowDownRight, ArrowUpRight, Landmark, TrendingUp } from 'lucide-react';
import { Skeleton } from '../../../components/common/Skeleton';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/format';
import type { DashboardSummary } from '../dashboard.utils';
import { formatSignedPercent } from '../dashboard.utils';

interface DashboardStatsProps {
  summary: DashboardSummary;
  activeAccountCount: number;
  loading?: boolean;
}

export function DashboardStats({ summary, activeAccountCount, loading = false }: DashboardStatsProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-4">
        {['balance', 'income', 'expense', 'difference'].map((item) => (
          <div key={item} className="min-h-36 rounded-panel border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-8 w-36" />
              </div>
              <Skeleton className="h-9 w-9 shrink-0" />
            </div>
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-4">
      <StatCard
        label="Balance disponible"
        value={formatCurrency(summary.availableBalance)}
        helper={`${activeAccountCount} cuenta${activeAccountCount === 1 ? '' : 's'} activa${activeAccountCount === 1 ? '' : 's'}`}
        icon={Landmark}
        tone="info"
      />
      <StatCard
        label="Ingresos del mes"
        value={formatCurrency(summary.currentMonthIncome)}
        helper={`${formatSignedPercent(summary.incomeComparison)} vs. mes anterior`}
        icon={ArrowUpRight}
        tone="positive"
      />
      <StatCard
        label="Gastos del mes"
        value={formatCurrency(summary.currentMonthExpenses)}
        helper={`${formatSignedPercent(summary.expenseComparison)} vs. mes anterior`}
        icon={ArrowDownRight}
        tone="danger"
      />
      <StatCard
        label="Diferencia"
        value={formatCurrency(summary.cashflowDifference)}
        helper={summary.cashflowDifference >= 0 ? 'Flujo positivo este mes' : 'Gastos por encima de ingresos'}
        icon={TrendingUp}
        tone={summary.cashflowDifference >= 0 ? 'positive' : 'warning'}
      />
    </section>
  );
}
