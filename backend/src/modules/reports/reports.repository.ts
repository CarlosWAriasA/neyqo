import { DataSource, In, type SelectQueryBuilder } from 'typeorm';
import type { AccountType, CurrencyCode } from '../../entities/account.entity';
import { Budget } from '../../entities/budget.entity';
import { BudgetPeriodRecord } from '../../entities/budget-period.entity';
import { Transaction } from '../../entities/transaction.entity';
import { UserPreference } from '../../entities/user-preference.entity';
import type {
  BudgetPerformanceItem,
  ReportRequest,
  ResolvedReportRange,
} from './reports.schemas';

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

interface CurrencyTotalsRawRow {
  currency: CurrencyCode;
  incomeTotal: string | null;
  expenseTotal: string | null;
  transactionCount: string;
}

export interface CurrencyTotalsRow {
  currency: CurrencyCode;
  incomeTotal: number;
  expenseTotal: number;
  transactionCount: number;
}

interface CategorySpendingRawRow {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  currency: CurrencyCode;
  amount: string | null;
  transactionCount: string;
}

export interface CategorySpendingRow {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  currency: CurrencyCode;
  amount: number;
  transactionCount: number;
}

interface CashflowRawRow {
  bucket: string;
  currency: CurrencyCode;
  income: string | null;
  expenses: string | null;
}

export interface CashflowRow {
  bucket: string;
  label: string;
  currency: CurrencyCode;
  income: number;
  expenses: number;
  net: number;
}

interface AccountSpendingRawRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  currency: CurrencyCode;
  amount: string | null;
  transactionCount: string;
}

export interface AccountSpendingRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  currency: CurrencyCode;
  amount: number;
  transactionCount: number;
}

export class ReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getPrimaryCurrency(userId: string): Promise<CurrencyCode> {
    const preferences = await this.dataSource.getRepository(UserPreference).findOne({ where: { userId } });
    return preferences?.primaryCurrency ?? 'DOP';
  }

  async getCurrencyTotals(
    userId: string,
    request: ReportRequest,
    rangeName: 'current' | 'previous',
  ): Promise<CurrencyTotalsRow[]> {
    const rows = await this.baseTransactionQuery(userId, request, getRange(request.range, rangeName))
      .select('transaction.currency', 'currency')
      .addSelect("SUM(CASE WHEN transaction.type = 'income' THEN transaction.amount ELSE 0 END)", 'incomeTotal')
      .addSelect("SUM(CASE WHEN transaction.type = 'expense' THEN transaction.amount ELSE 0 END)", 'expenseTotal')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .andWhere('transaction.type IN (:...types)', { types: ['income', 'expense'] })
      .groupBy('transaction.currency')
      .orderBy('transaction.currency', 'ASC')
      .getRawMany<CurrencyTotalsRawRow>();

    return rows.map((row) => ({
      currency: row.currency,
      incomeTotal: Number(row.incomeTotal ?? 0),
      expenseTotal: Number(row.expenseTotal ?? 0),
      transactionCount: Number(row.transactionCount ?? 0),
    }));
  }

  async getCategorySpending(
    userId: string,
    request: ReportRequest,
    rangeName: 'current' | 'previous',
  ): Promise<CategorySpendingRow[]> {
    const rows = await this.baseTransactionQuery(userId, request, getRange(request.range, rangeName))
      .leftJoin('transaction.category', 'category')
      .select('transaction.categoryId', 'categoryId')
      .addSelect("COALESCE(category.name, 'Sin categoría')", 'categoryName')
      .addSelect('category.icon', 'categoryIcon')
      .addSelect('transaction.currency', 'currency')
      .addSelect('SUM(transaction.amount)', 'amount')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .andWhere('transaction.type = :type', { type: 'expense' })
      .groupBy('transaction.categoryId')
      .addGroupBy('category.name')
      .addGroupBy('category.icon')
      .addGroupBy('transaction.currency')
      .orderBy('SUM(transaction.amount)', 'DESC')
      .getRawMany<CategorySpendingRawRow>();

    return rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryIcon: row.categoryIcon,
      currency: row.currency,
      amount: Number(row.amount ?? 0),
      transactionCount: Number(row.transactionCount ?? 0),
    }));
  }

  async getCashflowBuckets(userId: string, request: ReportRequest): Promise<CashflowRow[]> {
    const bucketExpression = getBucketExpression(request.range);
    const rows = await this.baseTransactionQuery(userId, request, getRange(request.range, 'current'))
      .select(bucketExpression, 'bucket')
      .addSelect('transaction.currency', 'currency')
      .addSelect("SUM(CASE WHEN transaction.type = 'income' THEN transaction.amount ELSE 0 END)", 'income')
      .addSelect("SUM(CASE WHEN transaction.type = 'expense' THEN transaction.amount ELSE 0 END)", 'expenses')
      .andWhere('transaction.type IN (:...types)', { types: ['income', 'expense'] })
      .groupBy('bucket')
      .addGroupBy('transaction.currency')
      .orderBy('bucket', 'ASC')
      .addOrderBy('transaction.currency', 'ASC')
      .getRawMany<CashflowRawRow>();

    return rows.map((row) => {
      const income = Number(row.income ?? 0);
      const expenses = Number(row.expenses ?? 0);

      return {
        bucket: row.bucket,
        label: row.bucket,
        currency: row.currency,
        income,
        expenses,
        net: income - expenses,
      };
    });
  }

  async getSpendingByAccount(userId: string, request: ReportRequest): Promise<AccountSpendingRow[]> {
    const rows = await this.baseTransactionQuery(userId, request, getRange(request.range, 'current'))
      .innerJoin('transaction.sourceAccount', 'account')
      .select('account.id', 'accountId')
      .addSelect('account.name', 'accountName')
      .addSelect('account.type', 'accountType')
      .addSelect('transaction.currency', 'currency')
      .addSelect('SUM(transaction.amount)', 'amount')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .andWhere('transaction.type = :type', { type: 'expense' })
      .groupBy('account.id')
      .addGroupBy('account.name')
      .addGroupBy('account.type')
      .addGroupBy('transaction.currency')
      .orderBy('SUM(transaction.amount)', 'DESC')
      .getRawMany<AccountSpendingRawRow>();

    return rows.map((row) => ({
      accountId: row.accountId,
      accountName: row.accountName,
      accountType: row.accountType,
      currency: row.currency,
      amount: Number(row.amount ?? 0),
      transactionCount: Number(row.transactionCount ?? 0),
    }));
  }

  async getBudgetPerformance(
    userId: string,
    request: ReportRequest,
    primaryCurrency: CurrencyCode,
  ): Promise<BudgetPerformanceItem[]> {
    const budgets = await this.dataSource.getRepository(Budget).find({
      where: {
        userId,
        status: 'active',
      },
      relations: {
        categories: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const items = await Promise.all(
      budgets.map(async (budget) => {
        const categoryIds = budget.categories.map((category) => category.id);
        const periods = await this.dataSource.getRepository(BudgetPeriodRecord).find({
          where: {
            userId,
            budgetId: budget.id,
          },
        });
        const overlappingPeriods = periods.filter(
          (period) => period.startDate <= request.range.dateTo && period.endDate >= request.range.dateFrom,
        );
        const budgetedAmount =
          overlappingPeriods.length > 0
            ? overlappingPeriods.reduce((total, period) => total + Number(period.budgetedAmount), 0)
            : Number(budget.maxAmount);

        if (categoryIds.length === 0) {
          return [
            toBudgetPerformanceItem({
              budget,
              currency: primaryCurrency,
              budgetedAmount,
              spentAmount: 0,
            }),
          ];
        }

        const spendingQuery = this.dataSource
          .getRepository(Transaction)
          .createQueryBuilder('transaction')
          .select('transaction.currency', 'currency')
          .addSelect('SUM(transaction.amount)', 'spentAmount')
          .where('transaction.userId = :userId', { userId })
          .andWhere('transaction.type = :type', { type: 'expense' })
          .andWhere('transaction.status = :status', { status: 'completed' })
          .andWhere('transaction.categoryId IN (:...categoryIds)', { categoryIds })
          .andWhere('transaction.date BETWEEN :dateFrom AND :dateTo', {
            dateFrom: request.range.dateFrom,
            dateTo: request.range.dateTo,
          });

        if (request.filters.accountId) {
          spendingQuery.andWhere('transaction.sourceAccountId = :accountId', {
            accountId: request.filters.accountId,
          });
        }

        if (request.filters.categoryId) {
          spendingQuery.andWhere('transaction.categoryId = :categoryId', {
            categoryId: request.filters.categoryId,
          });
        }

        const spending = await spendingQuery
          .groupBy('transaction.currency')
          .getRawMany<{ currency: CurrencyCode; spentAmount: string | null }>();

        if (spending.length === 0) {
          return [
            toBudgetPerformanceItem({
              budget,
              currency: primaryCurrency,
              budgetedAmount,
              spentAmount: 0,
            }),
          ];
        }

        return spending.map((row) =>
          toBudgetPerformanceItem({
            budget,
            currency: row.currency,
            budgetedAmount,
            spentAmount: Number(row.spentAmount ?? 0),
          }),
        );
      }),
    );

    return items.flat().sort((first, second) => statusRank(second.status) - statusRank(first.status));
  }

  private baseTransactionQuery(
    userId: string,
    request: ReportRequest,
    range: DateRange,
  ): SelectQueryBuilder<Transaction> {
    const query = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .andWhere('transaction.date BETWEEN :dateFrom AND :dateTo', {
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });

    if (request.filters.accountId) {
      query.andWhere('transaction.sourceAccountId = :accountId', { accountId: request.filters.accountId });
    }

    if (request.filters.categoryId) {
      query.andWhere('transaction.categoryId = :categoryId', { categoryId: request.filters.categoryId });
    }

    return query;
  }
}

function getRange(range: ResolvedReportRange, rangeName: 'current' | 'previous'): DateRange {
  if (rangeName === 'previous') {
    return {
      dateFrom: range.previousDateFrom,
      dateTo: range.previousDateTo,
    };
  }

  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
  };
}

function getBucketExpression(range: ResolvedReportRange) {
  if (range.granularity === 'month') {
    return "to_char(date_trunc('month', transaction.date), 'YYYY-MM')";
  }

  if (range.granularity === 'week') {
    return "to_char(date_trunc('week', transaction.date), 'IYYY-IW')";
  }

  return "to_char(transaction.date, 'YYYY-MM-DD')";
}

function toBudgetPerformanceItem({
  budget,
  currency,
  budgetedAmount,
  spentAmount,
}: {
  budget: Budget;
  currency: CurrencyCode;
  budgetedAmount: number;
  spentAmount: number;
}): BudgetPerformanceItem {
  const percentageUsed = budgetedAmount > 0 ? Math.round((spentAmount / budgetedAmount) * 100) : 0;

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    currency,
    budgetedAmount,
    spentAmount,
    remainingAmount: budgetedAmount - spentAmount,
    percentageUsed,
    status: resolveProgressStatus(percentageUsed),
    categoryNames: budget.categories.map((category) => category.name),
  };
}

function resolveProgressStatus(percentageUsed: number): BudgetPerformanceItem['status'] {
  if (percentageUsed >= 100) {
    return 'exceeded';
  }

  if (percentageUsed >= 90) {
    return 'important-warning';
  }

  if (percentageUsed >= 75) {
    return 'moderate-warning';
  }

  return 'normal';
}

function statusRank(status: BudgetPerformanceItem['status']) {
  return {
    normal: 0,
    'moderate-warning': 1,
    'important-warning': 2,
    exceeded: 3,
  }[status];
}
