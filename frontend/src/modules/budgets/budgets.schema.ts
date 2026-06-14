import { z } from 'zod';

export const budgetSchema = z
  .object({
    name: z.string().min(2, 'Escribe un nombre claro.'),
    maxAmount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
    period: z.enum(['monthly', 'biweekly', 'weekly']),
    resetDayOfMonth: z.coerce.number().min(1).max(31).optional(),
    resetDayOfWeek: z.coerce.number().min(0).max(6).optional(),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    description: z.string().optional(),
  })
  .superRefine((value, context) => {
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

export type BudgetFormValues = z.input<typeof budgetSchema>;
export type BudgetFormSubmitValues = z.output<typeof budgetSchema>;
export type BudgetStatusFilter = 'active' | 'inactive' | 'all';

export const emptyBudgetValues: BudgetFormValues = {
  name: '',
  maxAmount: 0,
  period: 'monthly',
  resetDayOfMonth: new Date().getDate(),
  resetDayOfWeek: new Date().getDay(),
  categoryId: '',
  description: '',
};
