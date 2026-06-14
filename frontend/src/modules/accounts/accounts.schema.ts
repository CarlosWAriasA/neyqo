import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(2, 'Escribe un nombre claro.'),
  type: z.enum(['cash', 'bank', 'debit_card', 'credit_card', 'wallet', 'other']),
  currency: z.enum(['DOP', 'USD', 'EUR']),
  initialBalance: z.coerce.number(),
  description: z.string().optional(),
});

export type AccountFormValues = z.input<typeof accountSchema>;
export type AccountFormSubmitValues = z.output<typeof accountSchema>;

export const emptyAccountValues: AccountFormValues = {
  name: '',
  type: 'bank',
  currency: 'DOP',
  initialBalance: 0,
  description: '',
};
