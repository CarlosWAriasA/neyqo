import { z } from 'zod';

export const budgetParamsSchema = z.object({
  id: z.uuid(),
});

export const budgetPeriodSchema = z.enum(['weekly', 'biweekly', 'monthly']);

const budgetSchemaShape = {
  name: z.string().trim().min(2, 'Escribe un nombre claro.').max(90),
  maxAmount: z.coerce.number().finite().positive('El monto debe ser mayor que cero.').max(999_999_999.99),
  period: budgetPeriodSchema.default('monthly'),
  startDate: z.iso.date().optional(),
  resetDayOfMonth: z.coerce.number().int().min(1).max(31).optional().nullable(),
  resetDayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  categoryId: z.uuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  categoryIds: z.array(z.uuid()).min(1, 'Selecciona al menos una categoría.').optional(),
  description: z.string().trim().max(240).optional(),
};

export const createBudgetSchema = z.object(budgetSchemaShape).superRefine((value, context) => {
  if (!value.categoryId && (!value.categoryIds || value.categoryIds.length === 0)) {
    context.addIssue({
      code: 'custom',
      path: ['categoryId'],
      message: 'Selecciona una categoría.',
    });
  }

  if (value.period === 'weekly' && value.resetDayOfWeek === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['resetDayOfWeek'],
      message: 'Selecciona el día de reinicio.',
    });
  }

  if (value.period !== 'weekly' && value.resetDayOfMonth === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['resetDayOfMonth'],
      message: 'Selecciona el día de reinicio.',
    });
  }
});

export const updateBudgetSchema = z.object(budgetSchemaShape).partial().refine(
  (value) => Object.keys(value).length > 0,
  'Envía al menos un campo para actualizar.',
);

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
