export type CurrencyCode = 'DOP' | 'USD' | 'EUR';
export type AccountType = 'cash' | 'bank' | 'debit_card' | 'credit_card' | 'wallet' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type EntityStatus = 'active' | 'inactive';
export type BudgetStatus = 'normal' | 'moderate-warning' | 'important-warning' | 'exceeded';
export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  initialBalance: number;
  currentBalance: number;
  description?: string;
  status: EntityStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  description?: string;
  isDefault?: boolean;
  priority: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency?: CurrencyCode;
  sourceAccountId?: string;
  sourceAccount: string;
  destinationAccountId?: string;
  destinationAccount?: string;
  categoryId?: string;
  category?: string;
  categoryIcon?: string;
  description: string;
  date: string;
  note?: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  categoryIds: string[];
  categories: Array<{ id: string; name: string; icon: string }>;
  maxAmount: number;
  month: number;
  year: number;
  period: BudgetPeriod;
  startDate: string;
  resetDayOfMonth: number | null;
  resetDayOfWeek: number | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  periodHistory?: BudgetPeriodSummary[];
  currentExpenses?: BudgetExpense[];
  daysRemaining: number;
  spentAmount: number;
  percentageUsed: number;
  remainingAmount: number;
  status: BudgetStatus;
  recordStatus: EntityStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetExpense {
  id: string;
  description: string;
  date: string;
  amount: number;
  category: string;
}

export interface BudgetPeriodSummary {
  id: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'active' | 'closed';
  closedAt?: string;
}

export interface ScheduledMovement {
  id: string;
  type: 'income' | 'expense';
  name: string;
  description?: string;
  amount: number;
  sourceAccountId?: string;
  account: string;
  categoryId?: string;
  category: string;
  categoryIcon?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  dayOfWeek?: number;
  daysOfMonth?: number[];
  monthOfYear?: number;
  nextExecutionDate?: string;
  nextRunAt?: string;
  startDate: string;
  startsAt?: string;
  endDate?: string;
  endsAt?: string;
  status: 'active' | 'paused' | 'completed' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface UpcomingScheduledMovement {
  id: string;
  scheduledTransactionId: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  category: string;
  account: string;
  date: string;
}

export interface ScheduledSummary {
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
}

export interface GeneratedScheduledTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  account: string;
  category?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface ExternalConnection {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'connected' | 'disconnected' | 'preparing' | 'error';
  scopes: string[];
  lastSyncAt?: string;
  createdAt: string;
}

export interface EmailSyncRun {
  id: string;
  provider: 'gmail' | 'outlook';
  startedAt: string;
  finishedAt?: string;
  status: 'completed' | 'running' | 'failed';
  processedEmails: number;
  detectedTransactions: number;
  importedTransactions: number;
  errorMessage?: string;
}
