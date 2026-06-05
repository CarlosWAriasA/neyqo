import { z } from 'zod';

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const transactionStatusSchema = z.enum(['completed', 'pending', 'cancelled']);
export const transactionSourceSchema = z.enum(['scheduled_transaction', 'email_sync', 'system']);

export const transactionParamsSchema = z.object({
  id: z.uuid(),
});

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().finite().positive('El monto debe ser mayor que cero.').max(999_999_999.99),
  sourceAccountId: z.uuid(),
  destinationAccountId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  description: z.string().trim().min(2).max(140),
  date: z.iso.date(),
  status: transactionStatusSchema.default('completed'),
  note: z.string().trim().max(500).optional(),
});

export const createInternalTransactionSchema = createTransactionSchema
  .extend({
    userId: z.uuid(),
    source: transactionSourceSchema,
    scheduledTransactionId: z.uuid().optional(),
    scheduledExecutionDate: z.iso.date().optional(),
    processedAt: z.iso.datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.source === 'scheduled_transaction') {
      if (!value.scheduledTransactionId) {
        context.addIssue({
          code: 'custom',
          path: ['scheduledTransactionId'],
          message: 'scheduledTransactionId es obligatorio para transacciones programadas.',
        });
      }

      if (!value.scheduledExecutionDate) {
        context.addIssue({
          code: 'custom',
          path: ['scheduledExecutionDate'],
          message: 'scheduledExecutionDate es obligatorio para transacciones programadas.',
        });
      }
    }
  });

export const updateTransactionSchema = createTransactionSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Envía al menos un campo para actualizar.',
);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateInternalTransactionInput = z.infer<typeof createInternalTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
