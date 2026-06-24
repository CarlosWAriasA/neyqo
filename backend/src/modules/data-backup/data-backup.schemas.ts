import { z } from 'zod';

const currencySchema = z.enum(['DOP', 'USD', 'EUR']);
const entityStatusSchema = z.enum(['active', 'inactive']);
const uuidSchema = z.uuid();
const isoDateSchema = z.iso.date();

export const backupPreferenceSchema = z.object({
  primaryCurrency: currencySchema,
  dateFormat: z.enum(['dd-mm-yyyy', 'yyyy-mm-dd']),
  weekStartsOn: z.enum(['monday', 'sunday']),
  theme: z.enum(['light', 'dark', 'system']),
  hideBalances: z.boolean(),
  budgetAlerts: z.boolean(),
});

export const backupAccountSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(90),
  type: z.enum(['cash', 'bank', 'debit_card', 'credit_card', 'wallet', 'other']),
  currency: currencySchema,
  initialBalance: z.coerce.number().finite().min(-999_999_999.99).max(999_999_999.99),
  description: z.string().trim().max(240).optional(),
  status: entityStatusSchema.default('active'),
});

export const backupCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(90),
  type: z.enum(['income', 'expense']),
  icon: z.string().trim().min(1).max(40),
  description: z.string().trim().max(240).optional(),
  priority: z.coerce.number().int().min(0).max(999).default(100),
  status: entityStatusSchema.default('active'),
});

export const backupTransactionSchema = z.object({
  id: uuidSchema,
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.coerce.number().finite().positive().max(999_999_999.99),
  destinationAmount: z.coerce.number().finite().positive().max(999_999_999.99).optional(),
  sourceAccountId: uuidSchema,
  destinationAccountId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  description: z.string().trim().min(2).max(140),
  date: isoDateSchema,
  status: z.enum(['completed', 'pending', 'cancelled']).default('completed'),
  note: z.string().trim().max(500).optional(),
});

export const backupBudgetSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(90),
  maxAmount: z.coerce.number().finite().positive().max(999_999_999.99),
  period: z.enum(['weekly', 'biweekly', 'monthly']),
  startDate: isoDateSchema.optional(),
  resetDayOfMonth: z.coerce.number().int().min(1).max(31).nullable().optional(),
  resetDayOfWeek: z.coerce.number().int().min(0).max(6).nullable().optional(),
  categoryId: uuidSchema,
  description: z.string().trim().max(240).optional(),
  status: entityStatusSchema.default('active'),
});

export const backupScheduledTransactionSchema = z.object({
  id: uuidSchema,
  type: z.enum(['income', 'expense']),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(140).optional(),
  amount: z.coerce.number().finite().positive().max(999_999_999.99),
  sourceAccountId: uuidSchema,
  categoryId: uuidSchema,
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  daysOfMonth: z.array(z.coerce.number().int().min(1).max(31)).max(31).optional(),
  monthOfYear: z.coerce.number().int().min(1).max(12).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  status: z.enum(['active', 'paused', 'completed', 'inactive']).default('active'),
});

export const neyqoBackupSchema = z.object({
  app: z.literal('neyqo'),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  data: z.object({
    preferences: backupPreferenceSchema.optional(),
    accounts: z.array(backupAccountSchema).default([]),
    categories: z.array(backupCategorySchema).default([]),
    transactions: z.array(backupTransactionSchema).default([]),
    budgets: z.array(backupBudgetSchema).default([]),
    scheduledTransactions: z.array(backupScheduledTransactionSchema).default([]),
  }),
});

export const importSummaryItemSchema = z.object({
  created: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export const importSummarySchema = z.object({
  accounts: importSummaryItemSchema,
  categories: importSummaryItemSchema,
  transactions: importSummaryItemSchema,
  budgets: importSummaryItemSchema,
  scheduledTransactions: importSummaryItemSchema,
  preferences: z.object({ updated: z.boolean() }),
});

export type NeyqoBackupDocument = z.infer<typeof neyqoBackupSchema>;
export type BackupAccount = z.infer<typeof backupAccountSchema>;
export type BackupCategory = z.infer<typeof backupCategorySchema>;
export type BackupTransaction = z.infer<typeof backupTransactionSchema>;
export type BackupBudget = z.infer<typeof backupBudgetSchema>;
export type BackupScheduledTransaction = z.infer<typeof backupScheduledTransactionSchema>;
export type ImportSummary = z.infer<typeof importSummarySchema>;
