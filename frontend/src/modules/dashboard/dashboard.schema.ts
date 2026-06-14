import { z } from 'zod';

export const quickTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  sourceAccountId: z.string().min(1, 'Selecciona una cuenta.'),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  description: z.string().trim().min(2, 'Agrega una descripción.').max(140),
  date: z.string().min(1, 'Selecciona una fecha.'),
  note: z.string().trim().max(500).optional(),
});

export type QuickTransactionValues = z.input<typeof quickTransactionSchema>;
export type QuickTransactionSubmitValues = z.output<typeof quickTransactionSchema>;

export const emptyQuickTransactionValues: QuickTransactionValues = {
  type: 'expense',
  amount: 0,
  sourceAccountId: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
};
