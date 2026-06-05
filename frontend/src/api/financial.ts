import {
  mockEmailSyncRuns,
  mockExternalConnections,
} from '../mocks/financial';
import type { Account, Budget, BudgetExpense, BudgetPeriodSummary, Category, Transaction } from '../types/financial';
import type {
  GeneratedScheduledTransaction,
  ScheduledMovement,
  ScheduledSummary,
  UpcomingScheduledMovement,
} from '../types/financial';
import { apiClient } from './client';

export interface AccountPayload {
  name: string;
  type: Account['type'];
  currency: Account['currency'];
  initialBalance: number;
  description?: string;
}

export interface CategoryPayload {
  name: string;
  type: Category['type'];
  icon: string;
  priority: number;
  description?: string;
}

export interface TransactionPayload {
  type: Transaction['type'];
  amount: number;
  sourceAccountId: string;
  destinationAccountId?: string;
  categoryId?: string;
  description: string;
  date: string;
  status?: Transaction['status'];
  note?: string;
}

export interface BudgetPayload {
  name: string;
  maxAmount: number;
  period: Budget['period'];
  startDate?: string;
  resetDayOfMonth?: number | null;
  resetDayOfWeek?: number | null;
  categoryId: string;
  month?: number;
  year?: number;
  categoryIds?: string[];
  description?: string;
}

export interface ScheduledTransactionPayload {
  type: 'income' | 'expense';
  name: string;
  description?: string;
  amount: number;
  sourceAccountId: string;
  categoryId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  dayOfWeek?: number;
  daysOfMonth?: number[];
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
}

export async function getAccounts() {
  const response = await apiClient.get<{ accounts: Account[] }>('/accounts');
  return response.data.accounts;
}

export async function createAccount(payload: AccountPayload) {
  const response = await apiClient.post<{ account: Account }>('/accounts', payload);
  return response.data.account;
}

export async function updateAccount(accountId: string, payload: Partial<AccountPayload>) {
  const response = await apiClient.patch<{ account: Account }>(`/accounts/${accountId}`, payload);
  return response.data.account;
}

export async function deactivateAccount(accountId: string) {
  const response = await apiClient.patch<{ account: Account }>(`/accounts/${accountId}/deactivate`);
  return response.data.account;
}

export async function reactivateAccount(accountId: string) {
  const response = await apiClient.patch<{ account: Account }>(`/accounts/${accountId}/reactivate`);
  return response.data.account;
}

export async function getTransactions() {
  const response = await apiClient.get<{ transactions: Transaction[] }>('/transactions');
  return response.data.transactions;
}

export async function createTransaction(payload: TransactionPayload) {
  const response = await apiClient.post<{ transaction: Transaction }>('/transactions', payload);
  return response.data.transaction;
}

export async function updateTransaction(transactionId: string, payload: Partial<TransactionPayload>) {
  const response = await apiClient.patch<{ transaction: Transaction }>(`/transactions/${transactionId}`, payload);
  return response.data.transaction;
}

export async function deleteTransaction(transactionId: string) {
  await apiClient.delete(`/transactions/${transactionId}`);
}

export async function getCategories() {
  const response = await apiClient.get<{ categories: Category[] }>('/categories');
  return response.data.categories;
}

export async function createCategory(payload: CategoryPayload) {
  const response = await apiClient.post<{ category: Category }>('/categories', payload);
  return response.data.category;
}

export async function updateCategory(categoryId: string, payload: Partial<CategoryPayload>) {
  const response = await apiClient.patch<{ category: Category }>(`/categories/${categoryId}`, payload);
  return response.data.category;
}

export async function deactivateCategory(categoryId: string) {
  const response = await apiClient.patch<{ category: Category }>(`/categories/${categoryId}/deactivate`);
  return response.data.category;
}

export async function reactivateCategory(categoryId: string) {
  const response = await apiClient.patch<{ category: Category }>(`/categories/${categoryId}/reactivate`);
  return response.data.category;
}

export async function getBudgets() {
  const response = await apiClient.get<{ budgets: Budget[] }>('/budgets');
  return response.data.budgets;
}

export async function getBudget(budgetId: string) {
  const response = await apiClient.get<{ budget: Budget }>(`/budgets/${budgetId}`);
  return response.data.budget;
}

export async function createBudget(payload: BudgetPayload) {
  const response = await apiClient.post<{ budget: Budget }>('/budgets', payload);
  return response.data.budget;
}

export async function updateBudget(budgetId: string, payload: Partial<BudgetPayload>) {
  const response = await apiClient.patch<{ budget: Budget }>(`/budgets/${budgetId}`, payload);
  return response.data.budget;
}

export async function deactivateBudget(budgetId: string) {
  const response = await apiClient.patch<{ budget: Budget }>(`/budgets/${budgetId}/deactivate`);
  return response.data.budget;
}

export async function reactivateBudget(budgetId: string) {
  const response = await apiClient.patch<{ budget: Budget }>(`/budgets/${budgetId}/reactivate`);
  return response.data.budget;
}

export async function getBudgetPeriods(budgetId: string) {
  const response = await apiClient.get<{ periods: BudgetPeriodSummary[] }>(`/budgets/${budgetId}/periods`);
  return response.data.periods;
}

export async function getBudgetExpenses(budgetId: string) {
  const response = await apiClient.get<{ expenses: BudgetExpense[] }>(`/budgets/${budgetId}/expenses`);
  return response.data.expenses;
}

export async function getScheduledMovements() {
  const response = await apiClient.get<{ scheduledTransactions: ScheduledMovement[] }>('/scheduled-transactions');
  return response.data.scheduledTransactions;
}

export async function getUpcomingScheduledMovements() {
  const response = await apiClient.get<{ upcoming: UpcomingScheduledMovement[] }>('/scheduled-transactions/upcoming');
  return response.data.upcoming;
}

export async function getScheduledSummary() {
  const response = await apiClient.get<{ summary: ScheduledSummary }>('/scheduled-transactions/summary');
  return response.data.summary;
}

export async function getGeneratedScheduledTransactions(scheduledTransactionId: string) {
  const response = await apiClient.get<{ transactions: GeneratedScheduledTransaction[] }>(
    `/scheduled-transactions/${scheduledTransactionId}/generated-transactions`,
  );
  return response.data.transactions;
}

export async function createScheduledMovement(payload: ScheduledTransactionPayload) {
  const response = await apiClient.post<{ scheduledTransaction: ScheduledMovement }>('/scheduled-transactions', payload);
  return response.data.scheduledTransaction;
}

export async function updateScheduledMovement(scheduledTransactionId: string, payload: Partial<ScheduledTransactionPayload>) {
  const response = await apiClient.put<{ scheduledTransaction: ScheduledMovement }>(
    `/scheduled-transactions/${scheduledTransactionId}`,
    payload,
  );
  return response.data.scheduledTransaction;
}

export async function pauseScheduledMovement(scheduledTransactionId: string) {
  const response = await apiClient.patch<{ scheduledTransaction: ScheduledMovement }>(
    `/scheduled-transactions/${scheduledTransactionId}/pause`,
  );
  return response.data.scheduledTransaction;
}

export async function resumeScheduledMovement(scheduledTransactionId: string) {
  const response = await apiClient.patch<{ scheduledTransaction: ScheduledMovement }>(
    `/scheduled-transactions/${scheduledTransactionId}/resume`,
  );
  return response.data.scheduledTransaction;
}

export async function deactivateScheduledMovement(scheduledTransactionId: string) {
  const response = await apiClient.patch<{ scheduledTransaction: ScheduledMovement }>(
    `/scheduled-transactions/${scheduledTransactionId}/deactivate`,
  );
  return response.data.scheduledTransaction;
}

export async function getExternalConnections() {
  return mockExternalConnections;
}

export async function getEmailSyncRuns() {
  return mockEmailSyncRuns;
}
