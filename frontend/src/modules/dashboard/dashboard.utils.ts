import type { TransactionPayload } from '../../api/financial';
import type { Account, Budget, Transaction } from '../../types/financial';
import type { QuickTransactionSubmitValues } from './dashboard.schema';

export interface DashboardSummary {
  availableBalance: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  cashflowDifference: number;
  incomeComparison: number;
  expenseComparison: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  nearLimitCount: number;
  exceededCount: number;
  percentageUsed: number;
}

export function toQuickTransactionPayload(values: QuickTransactionSubmitValues): TransactionPayload {
  return {
    type: values.type,
    amount: values.amount,
    sourceAccountId: values.sourceAccountId,
    categoryId: values.categoryId,
    description: values.description.trim(),
    date: values.date,
    status: 'completed',
    note: values.note?.trim() || undefined,
  };
}

export function buildDashboardSummary(accounts: Account[], transactions: Transaction[]): DashboardSummary {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = getMonthKey(previousMonthDate);
  const completedTransactions = transactions.filter((transaction) => transaction.status === 'completed');
  const currentMonthTransactions = completedTransactions.filter((transaction) => getMonthKey(new Date(transaction.date)) === currentMonthKey);
  const previousMonthTransactions = completedTransactions.filter((transaction) => getMonthKey(new Date(transaction.date)) === previousMonthKey);
  const currentMonthIncome = sumTransactions(currentMonthTransactions, 'income');
  const currentMonthExpenses = sumTransactions(currentMonthTransactions, 'expense');
  const previousMonthIncome = sumTransactions(previousMonthTransactions, 'income');
  const previousMonthExpenses = sumTransactions(previousMonthTransactions, 'expense');

  return {
    availableBalance: accounts.reduce((total, account) => total + account.currentBalance, 0),
    currentMonthIncome,
    currentMonthExpenses,
    cashflowDifference: currentMonthIncome - currentMonthExpenses,
    incomeComparison: calculateComparison(currentMonthIncome, previousMonthIncome),
    expenseComparison: calculateComparison(currentMonthExpenses, previousMonthExpenses),
  };
}

export function buildBudgetSummary(activeBudgets: Budget[]): BudgetSummary {
  const totalBudgeted = activeBudgets.reduce((total, budget) => total + budget.maxAmount, 0);
  const totalSpent = activeBudgets.reduce((total, budget) => total + budget.spentAmount, 0);
  const nearLimitCount = activeBudgets.filter(
    (budget) => budget.status === 'moderate-warning' || budget.status === 'important-warning',
  ).length;
  const exceededCount = activeBudgets.filter((budget) => budget.status === 'exceeded').length;
  const percentageUsed = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return {
    totalBudgeted,
    totalSpent,
    nearLimitCount,
    exceededCount,
    percentageUsed,
  };
}

export function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value}%`;
}

function sumTransactions(transactions: Transaction[], type: Transaction['type']) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function calculateComparison(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}
