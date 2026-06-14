import { z } from 'zod';

export const scheduledSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    name: z.string().trim().min(2, 'Escribe un nombre.').max(120),
    amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
    sourceAccountId: z.string().min(1, 'Selecciona una cuenta.'),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
    dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
    firstDayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    secondDayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
    monthOfYear: z.coerce.number().int().min(1).max(12).optional(),
    startDate: z.string().min(1, 'Selecciona una fecha inicial.'),
    endDate: z.string().optional(),
    description: z.string().trim().max(140).optional(),
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'La fecha final no puede ser anterior a la inicial.',
      });
    }

    if (value.frequency === 'biweekly' && value.firstDayOfMonth === value.secondDayOfMonth) {
      context.addIssue({
        code: 'custom',
        path: ['secondDayOfMonth'],
        message: 'Los días quincenales deben ser distintos.',
      });
    }
  });

export type ScheduledFormValues = z.input<typeof scheduledSchema>;
export type ScheduledFormSubmitValues = z.output<typeof scheduledSchema>;
export type ScheduledFilter = 'all' | 'active' | 'paused' | 'expense' | 'income';

export const emptyScheduledValues: ScheduledFormValues = {
  type: 'expense',
  name: '',
  amount: 0,
  sourceAccountId: '',
  categoryId: '',
  frequency: 'monthly',
  dayOfWeek: 1,
  firstDayOfMonth: 15,
  secondDayOfMonth: 30,
  monthOfYear: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  description: '',
};
