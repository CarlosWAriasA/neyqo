import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Escribe un nombre claro.').max(90, 'Usa 90 caracteres o menos.'),
  type: z.enum(['cash', 'bank', 'debit_card', 'credit_card', 'wallet', 'other']),
  currency: z.enum(['DOP', 'USD', 'EUR']),
  institutionName: z.string().trim().max(90, 'Usa 90 caracteres o menos.').optional(),
  lastFour: z
    .string()
    .trim()
    .regex(/^\d{4}$|^$/, 'Usa exactamente 4 dígitos o déjalo vacío.')
    .optional(),
  initialBalance: z.coerce
    .number()
    .finite('Escribe un monto válido.')
    .min(-999_999_999.99, 'El monto es demasiado bajo.')
    .max(999_999_999.99, 'El monto es demasiado alto.'),
  description: z.string().trim().max(240, 'Usa 240 caracteres o menos.').optional(),
});

export type AccountFormValues = z.input<typeof accountSchema>;
export type AccountFormSubmitValues = z.output<typeof accountSchema>;

export const emptyAccountValues: AccountFormValues = {
  name: '',
  type: 'bank',
  currency: 'DOP',
  institutionName: '',
  lastFour: '',
  initialBalance: 0,
  description: '',
};
