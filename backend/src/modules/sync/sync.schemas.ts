import { z } from 'zod';
import { buildPaginationSchema } from '../../utils/pagination';

export const emailImportBankCodeSchema = z.enum([
  'popular',
  'qik',
  'santa_cruz',
  'banesco',
  'asociacion_popular',
  'lafise',
  'bhd',
  'banreservas',
  'bdi',
  'unknown',
]);
export const emailImportProductKindSchema = z.enum(['card', 'account', 'unknown']);
export const emailImportRuleStatusSchema = z.enum(['active', 'inactive']);
export const importedTransactionEventTypeSchema = z.enum([
  'purchase',
  'reversal',
  'payment',
  'withdrawal',
  'deposit',
  'transfer',
  'unknown',
]);
export const importedTransactionStatusSchema = z.enum([
  'ready_for_review',
  'needs_review',
  'ignored',
  'imported',
  'failed',
]);
export const importedTransactionProviderStatusSchema = z.enum(['approved', 'declined', 'pending', 'unknown']);
export const emailSyncProviderSchema = z.enum(['gmail', 'outlook']);

export const createImportRuleSchema = z.object({
  bankCode: emailImportBankCodeSchema,
  accountId: z.uuid(),
  categoryId: z.uuid(),
  productKind: emailImportProductKindSchema.default('card'),
  cardLastDigits: z.string().trim().regex(/^\d{4}$/).optional(),
  merchantPattern: z.string().trim().min(2).max(120).optional(),
});

export const updateImportRuleSchema = createImportRuleSchema
  .partial()
  .extend({
    status: emailImportRuleStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo para actualizar.');

export const importRuleParamsSchema = z.object({
  id: z.uuid(),
});

export const listImportRulesQuerySchema = z.object({
  bankCode: emailImportBankCodeSchema.optional(),
  status: emailImportRuleStatusSchema.or(z.literal('all')).optional(),
});

export const listImportedTransactionsQuerySchema = buildPaginationSchema(30).extend({
  status: importedTransactionStatusSchema.or(z.literal('all')).optional(),
  bankCode: emailImportBankCodeSchema.optional(),
});

export const importedTransactionParamsSchema = z.object({
  id: z.uuid(),
});

export const updateImportedTransactionSchema = z.object({
  status: z.enum(['ignored', 'needs_review']).optional(),
  accountId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  reviewNote: z.string().trim().max(500).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo para actualizar.');

export const createInternalImportedTransactionSchema = z.object({
  userId: z.uuid(),
  provider: emailSyncProviderSchema,
  externalMessageId: z.string().trim().min(1).max(255),
  bankCode: emailImportBankCodeSchema,
  eventType: importedTransactionEventTypeSchema,
  providerStatus: importedTransactionProviderStatusSchema.default('unknown'),
  productName: z.string().trim().max(120).optional(),
  cardLastDigits: z.string().trim().regex(/^\d{4}$/).optional(),
  merchant: z.string().trim().min(1).max(140),
  amount: z.coerce.number().finite().positive().max(999_999_999.99),
  currency: z.enum(['DOP', 'USD', 'EUR']),
  transactionDate: z.iso.date(),
  rawDescription: z.string().trim().min(1).max(1000),
  confidence: z.coerce.number().min(0).max(1).default(0),
});

export type CreateImportRuleInput = z.infer<typeof createImportRuleSchema>;
export type UpdateImportRuleInput = z.infer<typeof updateImportRuleSchema>;
export type ListImportRulesQuery = z.infer<typeof listImportRulesQuerySchema>;
export type ListImportedTransactionsQuery = z.infer<typeof listImportedTransactionsQuerySchema>;
export type UpdateImportedTransactionInput = z.infer<typeof updateImportedTransactionSchema>;
export type CreateInternalImportedTransactionInput = z.infer<typeof createInternalImportedTransactionSchema>;
