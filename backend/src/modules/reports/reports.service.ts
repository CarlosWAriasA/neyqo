import { DataSource } from 'typeorm';
import type { CurrencyCode } from '../../entities/account.entity';
import {
  resolveReportRange,
  type ReportsBudgetPerformanceResponse,
  type ReportsCashflowResponse,
  type ReportFiltersInput,
  type ReportRequest,
  type ReportsSpendingByAccountResponse,
  type ReportsSpendingByCategoryResponse,
  type ReportsSummaryResponse,
  type SpendingByCategoryItem,
} from './reports.schemas';
import { ReportsRepository, type CategorySpendingRow } from './reports.repository';

export class ReportsService {
  private readonly reportsRepository: ReportsRepository;

  constructor(dataSource: DataSource) {
    this.reportsRepository = new ReportsRepository(dataSource);
  }

  async summary(userId: string, filters: ReportFiltersInput): Promise<ReportsSummaryResponse> {
    const request = this.buildRequest(filters);
    const [currentTotals, previousTotals, categorySpending] = await Promise.all([
      this.reportsRepository.getCurrencyTotals(userId, request, 'current'),
      this.reportsRepository.getCurrencyTotals(userId, request, 'previous'),
      this.reportsRepository.getCategorySpending(userId, request, 'current'),
    ]);

    return {
      resolvedRange: request.range,
      summaries: currentTotals.map((current) => {
        const previous = previousTotals.find((row) => row.currency === current.currency);
        const topCategory = categorySpending.find((row) => row.currency === current.currency);
        const netCashflow = current.incomeTotal - current.expenseTotal;
        const previousNetCashflow = (previous?.incomeTotal ?? 0) - (previous?.expenseTotal ?? 0);

        return {
          currency: current.currency,
          incomeTotal: current.incomeTotal,
          expenseTotal: current.expenseTotal,
          netCashflow,
          savingsRate: calculateSavingsRate(current.incomeTotal, current.expenseTotal),
          transactionCount: current.transactionCount,
          topExpenseCategory: topCategory?.categoryName ?? null,
          previousPeriodComparison: {
            income: calculateComparison(current.incomeTotal, previous?.incomeTotal ?? 0),
            expenses: calculateComparison(current.expenseTotal, previous?.expenseTotal ?? 0),
            netCashflow: calculateComparison(netCashflow, previousNetCashflow),
          },
        };
      }),
    };
  }

  async cashflow(userId: string, filters: ReportFiltersInput): Promise<ReportsCashflowResponse> {
    const request = this.buildRequest(filters);
    const buckets = await this.reportsRepository.getCashflowBuckets(userId, request);

    return {
      resolvedRange: request.range,
      buckets,
    };
  }

  async spendingByCategory(userId: string, filters: ReportFiltersInput): Promise<ReportsSpendingByCategoryResponse> {
    const request = this.buildRequest(filters);
    const [currentRows, previousRows] = await Promise.all([
      this.reportsRepository.getCategorySpending(userId, request, 'current'),
      this.reportsRepository.getCategorySpending(userId, request, 'previous'),
    ]);

    return {
      resolvedRange: request.range,
      categories: withCategoryPercentages(currentRows, previousRows),
    };
  }

  async spendingByAccount(userId: string, filters: ReportFiltersInput): Promise<ReportsSpendingByAccountResponse> {
    const request = this.buildRequest(filters);
    const rows = await this.reportsRepository.getSpendingByAccount(userId, request);
    const totals = totalByCurrency(rows);

    return {
      resolvedRange: request.range,
      accounts: rows.map((row) => ({
        ...row,
        percentageOfCurrencyExpenses: calculateShare(row.amount, totals.get(row.currency) ?? 0),
      })),
    };
  }

  async budgetPerformance(userId: string, filters: ReportFiltersInput): Promise<ReportsBudgetPerformanceResponse> {
    const request = this.buildRequest(filters);
    const primaryCurrency = await this.reportsRepository.getPrimaryCurrency(userId);
    const budgets = await this.reportsRepository.getBudgetPerformance(userId, request, primaryCurrency);

    return {
      resolvedRange: request.range,
      budgets,
    };
  }

  private buildRequest(filters: ReportFiltersInput): ReportRequest {
    return {
      filters,
      range: resolveReportRange(filters),
    };
  }
}

function withCategoryPercentages(
  currentRows: CategorySpendingRow[],
  previousRows: CategorySpendingRow[],
): SpendingByCategoryItem[] {
  const totals = totalByCurrency(currentRows);

  return currentRows.map((row) => {
    const previous = previousRows.find(
      (previousRow) => previousRow.currency === row.currency && previousRow.categoryId === row.categoryId,
    );

    return {
      ...row,
      percentageOfCurrencyExpenses: calculateShare(row.amount, totals.get(row.currency) ?? 0),
      previousPeriodChange: calculateComparison(row.amount, previous?.amount ?? 0),
    };
  });
}

function totalByCurrency(rows: Array<{ currency: CurrencyCode; amount: number }>) {
  const totals = new Map<CurrencyCode, number>();

  rows.forEach((row) => {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amount);
  });

  return totals;
}

function calculateShare(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function calculateComparison(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

function calculateSavingsRate(incomeTotal: number, expenseTotal: number) {
  if (incomeTotal <= 0) {
    return 0;
  }

  return Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100);
}
