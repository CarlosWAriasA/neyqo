import type {
  BudgetListParams,
  EmailImportRuleListParams,
  ImportedTransactionListParams,
  ScheduledMovementListParams,
  TransactionListParams,
} from '../../api/financial';
import type { ReportFilters } from '../../api/reports';

export const financeQueryKeys = {
  accounts: ['finance', 'accounts'] as const,
  categories: ['finance', 'categories'] as const,
  preferences: ['finance', 'preferences'] as const,
  exchangeRateQuote: (base: string, quote: string, amount: number) =>
    ['finance', 'exchange-rate-quote', base, quote, amount] as const,
  externalConnections: ['finance', 'external-connections'] as const,
  transactions: (filters: Omit<TransactionListParams, 'cursor'> = {}) =>
    ['finance', 'transactions', normalizeFilters(filters)] as const,
  budgets: (filters: Omit<BudgetListParams, 'cursor'> = {}) =>
    ['finance', 'budgets', normalizeFilters(filters)] as const,
  budget: (budgetId: string) => ['finance', 'budget', budgetId] as const,
  scheduledMovements: (filters: Omit<ScheduledMovementListParams, 'cursor'> = {}) =>
    ['finance', 'scheduled-movements', normalizeFilters(filters)] as const,
  scheduledUpcoming: ['finance', 'scheduled-upcoming'] as const,
  scheduledSummary: ['finance', 'scheduled-summary'] as const,
  scheduledGenerated: (scheduledMovementId: string) =>
    ['finance', 'scheduled-generated', scheduledMovementId] as const,
  emailImportRules: (filters: EmailImportRuleListParams = {}) =>
    ['finance', 'email-import-rules', normalizeFilters(filters)] as const,
  importedTransactions: (filters: Omit<ImportedTransactionListParams, 'cursor'> = {}) =>
    ['finance', 'imported-transactions', normalizeFilters(filters)] as const,
  reportsSummary: (filters: ReportFilters = {}) =>
    ['finance', 'reports', 'summary', normalizeFilters(filters)] as const,
  reportsCashflow: (filters: ReportFilters = {}) =>
    ['finance', 'reports', 'cashflow', normalizeFilters(filters)] as const,
  reportsSpendingByCategory: (filters: ReportFilters = {}) =>
    ['finance', 'reports', 'spending-by-category', normalizeFilters(filters)] as const,
  reportsSpendingByAccount: (filters: ReportFilters = {}) =>
    ['finance', 'reports', 'spending-by-account', normalizeFilters(filters)] as const,
  reportsBudgetPerformance: (filters: ReportFilters = {}) =>
    ['finance', 'reports', 'budget-performance', normalizeFilters(filters)] as const,
};

function normalizeFilters<T extends object>(filters: T) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== 'all'),
  );
}
