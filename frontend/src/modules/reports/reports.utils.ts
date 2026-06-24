import type {
  BudgetPerformanceItem,
  CashflowBucket,
  CurrencySummary,
  ReportFilters,
  SpendingByAccountItem,
  SpendingByCategoryItem,
} from '../../api/reports';
import type { CurrencyCode } from '../../types/financial';
import { formatCurrency } from '../../utils/format';
import type { ReportFilterState, ReportPreset } from './reports.schema';

export const reportPresetLabels: Record<ReportPreset, string> = {
  'current-month': 'Mes actual',
  'last-3-months': 'Últimos 3 meses',
  'last-6-months': 'Últimos 6 meses',
  'year-to-date': 'Año actual',
  custom: 'Personalizado',
};

export const reportPresetOptions = Object.entries(reportPresetLabels).map(([value, label]) => ({
  value: value as ReportPreset,
  label,
}));

export const chartColors = {
  income: 'rgb(var(--color-positive))',
  expenses: 'rgb(var(--color-danger))',
  net: 'rgb(var(--color-primary))',
  muted: 'rgb(var(--color-border))',
  text: 'rgb(var(--color-text))',
  subtle: 'rgb(var(--color-subtle))',
  warning: 'rgb(var(--color-warning))',
};

export function toReportQuery(filters: ReportFilterState): ReportFilters {
  return {
    preset: filters.preset,
    dateFrom: filters.preset === 'custom' ? filters.dateFrom || undefined : undefined,
    dateTo: filters.preset === 'custom' ? filters.dateTo || undefined : undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
  };
}

export function compactCurrency(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value}%`;
}

export function getCurrencyList(summary: CurrencySummary[] | undefined) {
  return (summary ?? []).map((item) => item.currency);
}

export function getCashflowForCurrency(buckets: CashflowBucket[] | undefined, currency: CurrencyCode) {
  return (buckets ?? []).filter((bucket) => bucket.currency === currency);
}

export function getCategoryItemsForCurrency(items: SpendingByCategoryItem[] | undefined, currency: CurrencyCode) {
  return (items ?? []).filter((item) => item.currency === currency).slice(0, 8);
}

export function getAccountItemsForCurrency(items: SpendingByAccountItem[] | undefined, currency: CurrencyCode) {
  return (items ?? []).filter((item) => item.currency === currency).slice(0, 8);
}

export function getBudgetItemsForCurrency(items: BudgetPerformanceItem[] | undefined, currency: CurrencyCode) {
  return (items ?? []).filter((item) => item.currency === currency);
}

export function buildInsights({
  summary,
  categories,
  budgets,
}: {
  summary: CurrencySummary | undefined;
  categories: SpendingByCategoryItem[];
  budgets: BudgetPerformanceItem[];
}) {
  const insights: Array<{ title: string; description: string; tone: 'neutral' | 'positive' | 'warning' | 'danger' }> = [];

  if (summary) {
    insights.push({
      title: summary.netCashflow >= 0 ? 'Flujo positivo' : 'Flujo bajo presión',
      description:
        summary.netCashflow >= 0
          ? `Cerraste este rango con ${formatCurrency(summary.netCashflow, summary.currency)} a favor.`
          : `Los gastos superan los ingresos por ${formatCurrency(Math.abs(summary.netCashflow), summary.currency)}.`,
      tone: summary.netCashflow >= 0 ? 'positive' : 'warning',
    });
  }

  const topCategory = categories[0];
  if (topCategory) {
    insights.push({
      title: 'Mayor concentración',
      description: `${topCategory.categoryName} representa ${topCategory.percentageOfCurrencyExpenses}% de los gastos en ${topCategory.currency}.`,
      tone: topCategory.percentageOfCurrencyExpenses >= 50 ? 'warning' : 'neutral',
    });
  }

  const riskyBudget = budgets.find((budget) => budget.status === 'exceeded' || budget.status === 'important-warning');
  if (riskyBudget) {
    insights.push({
      title: riskyBudget.status === 'exceeded' ? 'Presupuesto excedido' : 'Presupuesto cerca del límite',
      description: `${riskyBudget.budgetName} está en ${riskyBudget.percentageUsed}% de uso.`,
      tone: riskyBudget.status === 'exceeded' ? 'danger' : 'warning',
    });
  }

  return insights.slice(0, 4);
}
