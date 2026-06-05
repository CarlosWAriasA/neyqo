import { z } from 'zod';

export const scheduledTransactionParamsSchema = z.object({
  id: z.uuid(),
});

export const scheduledTransactionFrequencySchema = z.enum(['weekly', 'biweekly', 'monthly', 'yearly']);
export const scheduledTransactionTypeSchema = z.enum(['income', 'expense']);

const scheduledTransactionBaseSchema = z.object({
  type: scheduledTransactionTypeSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(140).optional(),
  amount: z.coerce.number().finite().positive('El monto debe ser mayor que cero.').max(999_999_999.99),
  sourceAccountId: z.uuid(),
  categoryId: z.uuid(),
  frequency: scheduledTransactionFrequencySchema,
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  daysOfMonth: z.array(z.coerce.number().int().min(1).max(31)).min(1).max(2).optional(),
  monthOfYear: z.coerce.number().int().min(1).max(12).optional(),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional(),
});

function validateScheduleConfig(
  value: Partial<z.infer<typeof scheduledTransactionBaseSchema>>,
  context: z.RefinementCtx,
) {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'La fecha final no puede ser anterior a la inicial.',
    });
  }

  if (value.frequency === 'weekly' && value.dayOfWeek === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['dayOfWeek'],
      message: 'Selecciona un día de la semana.',
    });
  }

  if (value.frequency === 'biweekly') {
    if (!value.daysOfMonth || value.daysOfMonth.length !== 2) {
      context.addIssue({
        code: 'custom',
        path: ['daysOfMonth'],
        message: 'Selecciona dos días del mes.',
      });
    } else if (value.daysOfMonth[0] === value.daysOfMonth[1]) {
      context.addIssue({
        code: 'custom',
        path: ['daysOfMonth'],
        message: 'Los días quincenales deben ser distintos.',
      });
    }
  }

  if (value.frequency === 'monthly' && (!value.daysOfMonth || value.daysOfMonth.length !== 1)) {
    context.addIssue({
      code: 'custom',
      path: ['daysOfMonth'],
      message: 'Selecciona un día del mes.',
    });
  }

  if (value.frequency === 'yearly') {
    if (!value.daysOfMonth || value.daysOfMonth.length !== 1) {
      context.addIssue({
        code: 'custom',
        path: ['daysOfMonth'],
        message: 'Selecciona un día.',
      });
    }

    if (value.monthOfYear === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['monthOfYear'],
        message: 'Selecciona un mes.',
      });
    }
  }
}

export const createScheduledTransactionSchema = scheduledTransactionBaseSchema.superRefine(
  validateScheduleConfig,
);

export const updateScheduledTransactionSchema = scheduledTransactionBaseSchema
  .partial()
  .superRefine(validateScheduleConfig)
  .refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo para actualizar.');

export type CreateScheduledTransactionInput = z.infer<typeof createScheduledTransactionSchema>;
export type UpdateScheduledTransactionInput = z.infer<typeof updateScheduledTransactionSchema>;
