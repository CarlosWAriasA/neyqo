import { BarChart3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  useAccounts,
  useCategories,
  useReportsBudgetPerformance,
  useReportsCashflow,
  useReportsSpendingByAccount,
  useReportsSpendingByCategory,
  useReportsSummary,
} from '../../features/finance/hooks';
import type { CurrencyCode } from '../../types/financial';
import { formatDate } from '../../utils/format';
import { BudgetPerformanceCard } from './components/BudgetPerformanceCard';
import { CashflowChartCard } from './components/CashflowChartCard';
import { CurrencySummaryCards } from './components/CurrencySummaryCards';
import { RankedBarsCard } from './components/RankedBarsCard';
import { ReportInsightsCard } from './components/ReportInsightsCard';
import { ReportsFilters } from './components/ReportsFilters';
import { defaultReportFilters } from './reports.schema';
import {
  buildInsights,
  getAccountItemsForCurrency,
  getBudgetItemsForCurrency,
  getCashflowForCurrency,
  getCategoryItemsForCurrency,
  getCurrencyList,
  toReportQuery,
} from './reports.utils';

export function ReportsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultReportFilters);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode | null>(null);
  const queryFilters = useMemo(() => toReportQuery(filters), [filters]);
  const filtersReady = filters.preset !== 'custom' || Boolean(filters.dateFrom && filters.dateTo);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const summaryQuery = useReportsSummary(queryFilters, filtersReady);
  const cashflowQuery = useReportsCashflow(queryFilters, filtersReady);
  const categoryQuery = useReportsSpendingByCategory(queryFilters, filtersReady);
  const accountQuery = useReportsSpendingByAccount(queryFilters, filtersReady);
  const budgetQuery = useReportsBudgetPerformance(queryFilters, filtersReady);
  const currencies = getCurrencyList(summaryQuery.data?.summaries);
  const activeCurrency = selectedCurrency && currencies.includes(selectedCurrency) ? selectedCurrency : currencies[0];
  const activeSummary = summaryQuery.data?.summaries.find((summary) => summary.currency === activeCurrency);
  const cashflowBuckets = activeCurrency ? getCashflowForCurrency(cashflowQuery.data?.buckets, activeCurrency) : [];
  const categoryItems = activeCurrency ? getCategoryItemsForCurrency(categoryQuery.data?.categories, activeCurrency) : [];
  const accountItems = activeCurrency ? getAccountItemsForCurrency(accountQuery.data?.accounts, activeCurrency) : [];
  const budgetItems = activeCurrency ? getBudgetItemsForCurrency(budgetQuery.data?.budgets, activeCurrency) : [];
  const insights = buildInsights({
    summary: activeSummary,
    categories: categoryItems,
    budgets: budgetItems,
  });
  const resolvedRange = summaryQuery.data?.resolvedRange;

  useEffect(() => {
    if (!selectedCurrency && currencies.length > 0) {
      setSelectedCurrency(currencies[0]);
    }
  }, [currencies, selectedCurrency]);

  return (
    <div className="grid gap-6 pb-8 lg:pb-10">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Evalúa ingresos, gastos, presupuestos y patrones por moneda sin mezclar balances incompatibles."
      />

      <ReportsFilters
        filters={filters}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        onChange={setFilters}
      />

      {!filtersReady ? (
        <Card className="border-warning/30 bg-warning/5 text-warning">
          Selecciona fecha inicial y final para cargar el rango personalizado.
        </Card>
      ) : null}

      {summaryQuery.isError ? (
        <ErrorState
          title="No pudimos cargar los reportes"
          description="Reintenta para volver a calcular tus indicadores."
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : null}

      {summaryQuery.isLoading && filtersReady ? <StatGridSkeleton count={4} /> : null}

      {!summaryQuery.isLoading && !summaryQuery.isError && filtersReady && currencies.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No hay datos para reportar"
          description="Registra ingresos o gastos completados en este rango para activar los reportes."
          actionLabel="Registrar transacción"
          onAction={() => navigate('/app/transactions')}
          secondaryActionLabel="Ver cuentas"
          onSecondaryAction={() => navigate('/app/accounts')}
        />
      ) : null}

      {activeCurrency && activeSummary ? (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Moneda {activeCurrency}</h2>
              {resolvedRange ? (
                <p className="mt-1 text-sm text-subtle">
                  {formatDate(resolvedRange.dateFrom)} - {formatDate(resolvedRange.dateTo)}
                </p>
              ) : null}
            </div>
            {currencies.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {currencies.map((currency) => (
                  <Button
                    key={currency}
                    type="button"
                    variant={currency === activeCurrency ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedCurrency(currency)}
                  >
                    {currency}
                  </Button>
                ))}
              </div>
            ) : null}
          </section>

          <CurrencySummaryCards summary={activeSummary} />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <CashflowChartCard
              currency={activeCurrency}
              buckets={cashflowBuckets}
              loading={cashflowQuery.isLoading}
              error={cashflowQuery.isError}
              onRetry={() => void cashflowQuery.refetch()}
            />
            <ReportInsightsCard insights={insights} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <RankedBarsCard
              title="Gasto por categoría"
              description="Categorías con mayor salida de dinero en el rango."
              currency={activeCurrency}
              items={categoryItems.map((item) => ({
                name: item.categoryName,
                amount: item.amount,
                percentage: item.percentageOfCurrencyExpenses,
                count: item.transactionCount,
              }))}
              loading={categoryQuery.isLoading}
              error={categoryQuery.isError}
              onRetry={() => void categoryQuery.refetch()}
            />
            <RankedBarsCard
              title="Gasto por cuenta"
              description="Cuentas desde donde se originaron los gastos."
              currency={activeCurrency}
              items={accountItems.map((item) => ({
                name: item.accountName,
                amount: item.amount,
                percentage: item.percentageOfCurrencyExpenses,
                count: item.transactionCount,
              }))}
              loading={accountQuery.isLoading}
              error={accountQuery.isError}
              onRetry={() => void accountQuery.refetch()}
            />
          </section>

          <BudgetPerformanceCard
            currency={activeCurrency}
            budgets={budgetItems}
            loading={budgetQuery.isLoading}
            error={budgetQuery.isError}
            onRetry={() => void budgetQuery.refetch()}
          />
        </>
      ) : null}
    </div>
  );
}
