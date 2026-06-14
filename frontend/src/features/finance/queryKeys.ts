import type {
  BudgetListParams,
  ScheduledMovementListParams,
  TransactionListParams,
} from '../../api/financial';

export const financeQueryKeys = {
  accounts: ['finance', 'accounts'] as const,
  categories: ['finance', 'categories'] as const,
  preferences: ['finance', 'preferences'] as const,
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
};

function normalizeFilters<T extends Record<string, unknown>>(filters: T) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''));
}
