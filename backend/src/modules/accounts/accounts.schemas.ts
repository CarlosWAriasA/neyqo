import { z } from 'zod';

export const accountTypeSchema = z.enum(['cash', 'bank', 'debit_card', 'credit_card', 'wallet', 'other']);
export const currencyCodeSchema = z.enum(['DOP', 'USD', 'EUR']);

export const createAccountSchema = z.object({
  name: z.string().trim().min(2, 'Escribe un nombre claro.').max(90),
  type: accountTypeSchema,
  currency: currencyCodeSchema,
  initialBalance: z.coerce.number().finite().min(-999_999_999.99).max(999_999_999.99).default(0),
  description: z.string().trim().max(240).optional(),
});

export const updateAccountSchema = createAccountSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Envía al menos un campo para actualizar.',
);

export const accountParamsSchema = z.object({
  id: z.uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
