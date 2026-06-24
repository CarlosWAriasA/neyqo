import type { AccountType, CurrencyCode } from '../types/financial';
import { apiClient } from './client';

export type ReportPreset = 'current-month' | 'last-3-months' | 'last-6-months' | 'year-to-date' | 'custom';

export interface ReportFilters {
  preset?: ReportPreset;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
}

export interface ResolvedReportRange {
  preset: ReportPreset;
  dateFrom: string;
  dateTo: string;
  previousDateFrom: string;
  previousDateTo: string;
  granularity: 'day' | 'week' | 'month';
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

export interface ReportsSummaryResponse {
  resolvedRange: ResolvedReportRange;
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

export interface ReportsCashflowResponse {
  resolvedRange: ResolvedReportRange;
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

export interface ReportsSpendingByCategoryResponse {
  resolvedRange: ResolvedReportRange;
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

export interface ReportsSpendingByAccountResponse {
  resolvedRange: ResolvedReportRange;
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

export interface ReportsBudgetPerformanceResponse {
  resolvedRange: ResolvedReportRange;
  budgets: BudgetPerformanceItem[];
}

export async function getReportsSummary(params: ReportFilters) {
  const response = await apiClient.get<ReportsSummaryResponse>('/reports/summary', { params });
  return response.data;
}

export async function getReportsCashflow(params: ReportFilters) {
  const response = await apiClient.get<ReportsCashflowResponse>('/reports/cashflow', { params });
  return response.data;
}

export async function getReportsSpendingByCategory(params: ReportFilters) {
  const response = await apiClient.get<ReportsSpendingByCategoryResponse>('/reports/spending-by-category', { params });
  return response.data;
}

export async function getReportsSpendingByAccount(params: ReportFilters) {
  const response = await apiClient.get<ReportsSpendingByAccountResponse>('/reports/spending-by-account', { params });
  return response.data;
}

export async function getReportsBudgetPerformance(params: ReportFilters) {
  const response = await apiClient.get<ReportsBudgetPerformanceResponse>('/reports/budget-performance', { params });
  return response.data;
}
