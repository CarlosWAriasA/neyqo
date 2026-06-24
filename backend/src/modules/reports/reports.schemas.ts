import { z } from 'zod';
import type { AccountType, CurrencyCode } from '../../entities/account.entity';

export const reportPresetSchema = z.enum([
  'current-month',
  'last-3-months',
  'last-6-months',
  'year-to-date',
  'custom',
]);

export type ReportPreset = z.infer<typeof reportPresetSchema>;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe ser una fecha ISO yyyy-mm-dd.');

export const reportFiltersSchema = z
  .object({
    preset: reportPresetSchema.default('current-month'),
    dateFrom: isoDateSchema.optional(),
    dateTo: isoDateSchema.optional(),
    accountId: z.uuid().optional(),
    categoryId: z.uuid().optional(),
  })
  .superRefine((value, context) => {
    if (value.preset === 'custom' && (!value.dateFrom || !value.dateTo)) {
      context.addIssue({
        code: 'custom',
        message: 'El rango personalizado requiere fecha inicial y final.',
        path: ['dateFrom'],
      });
    }

    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      context.addIssue({
        code: 'custom',
        message: 'La fecha inicial no puede ser posterior a la fecha final.',
        path: ['dateFrom'],
      });
    }
  });

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;

export interface ResolvedReportRange {
  preset: ReportPreset;
  dateFrom: string;
  dateTo: string;
  previousDateFrom: string;
  previousDateTo: string;
  granularity: 'day' | 'week' | 'month';
}

export interface ReportRequest {
  filters: ReportFiltersInput;
  range: ResolvedReportRange;
}

export interface ReportResponseBase {
  resolvedRange: ResolvedReportRange;
}

export interface CurrencySummary {
  currency: CurrencyCode;
  incomeTotal: number;
  expenseTotal: number;
  netCashflow: number;
  savingsRate: number;
  transactionCount: number;
  topExpenseCategory: string | null;
  previousPeriodComparison: {
    income: number;
    expenses: number;
    netCashflow: number;
  };
}

export interface ReportsSummaryResponse extends ReportResponseBase {
  summaries: CurrencySummary[];
}

export interface CashflowBucket {
  bucket: string;
  label: string;
  currency: CurrencyCode;
  income: number;
  expenses: number;
  net: number;
}

export interface ReportsCashflowResponse extends ReportResponseBase {
  buckets: CashflowBucket[];
}

export interface SpendingByCategoryItem {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  currency: CurrencyCode;
  amount: number;
  percentageOfCurrencyExpenses: number;
  transactionCount: number;
  previousPeriodChange: number;
}

export interface ReportsSpendingByCategoryResponse extends ReportResponseBase {
  categories: SpendingByCategoryItem[];
}

export interface SpendingByAccountItem {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  currency: CurrencyCode;
  amount: number;
  percentageOfCurrencyExpenses: number;
  transactionCount: number;
}

export interface ReportsSpendingByAccountResponse extends ReportResponseBase {
  accounts: SpendingByAccountItem[];
}

export interface BudgetPerformanceItem {
  budgetId: string;
  budgetName: string;
  currency: CurrencyCode;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'normal' | 'moderate-warning' | 'important-warning' | 'exceeded';
  categoryNames: string[];
}

export interface ReportsBudgetPerformanceResponse extends ReportResponseBase {
  budgets: BudgetPerformanceItem[];
}

export function resolveReportRange(input: ReportFiltersInput, now = new Date()): ResolvedReportRange {
  const preset = input.preset ?? 'current-month';
  const today = toDateKey(now);
  let dateFrom: string;
  let dateTo = today;

  if (preset === 'custom') {
    dateFrom = input.dateFrom!;
    dateTo = input.dateTo!;
  } else if (preset === 'year-to-date') {
    dateFrom = `${now.getFullYear()}-01-01`;
  } else if (preset === 'last-6-months') {
    dateFrom = addMonths(today, -6);
  } else if (preset === 'last-3-months') {
    dateFrom = addMonths(today, -3);
  } else {
    dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  const days = differenceInDays(dateFrom, dateTo) + 1;
  const previousDateTo = addDays(dateFrom, -1);
  const previousDateFrom = addDays(previousDateTo, -(days - 1));

  return {
    preset,
    dateFrom,
    dateTo,
    previousDateFrom,
    previousDateTo,
    granularity: days <= 45 ? 'day' : days <= 120 ? 'week' : 'month',
  };
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: string, days: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function addMonths(value: string, months: number) {
  const date = parseDateKey(value);
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

function differenceInDays(from: string, to: string) {
  return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / 86_400_000);
}
