import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Escribe un nombre.'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(2, 'Elige un icono.'),
  priority: z.coerce.number().int().min(1, 'Usa 1 o más.').max(999, 'Usa 999 o menos.'),
  description: z.string().optional(),
});

export type CategoryFormValues = z.input<typeof categorySchema>;
export type CategoryFormSubmitValues = z.output<typeof categorySchema>;
export type CategoryTypeFilter = 'all' | 'income' | 'expense';
export type CategoryStatusFilter = 'all' | 'active' | 'inactive';

export const emptyCategoryValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  icon: 'circle-ellipsis',
  priority: 100,
  description: '',
};
