import { z } from 'zod';
import type { Transaction } from '../../types/financial';

export const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.coerce
      .number()
      .positive('El monto debe ser mayor que cero.')
      .max(999_999_999.99, 'El monto es demasiado alto.')
      .refine(hasAtMostTwoDecimals, 'Usa como máximo dos decimales.'),
    sourceAccountId: z.string().min(1, 'Selecciona una cuenta origen.'),
    destinationAccountId: z.string().optional(),
    destinationAmount: z.coerce
      .number()
      .positive('El monto destino debe ser mayor que cero.')
      .max(999_999_999.99, 'El monto es demasiado alto.')
      .refine(hasAtMostTwoDecimals, 'Usa como máximo dos decimales.')
      .optional(),
    categoryId: z.string().optional(),
    description: z.string().min(2, 'Agrega una descripción.'),
    date: z.string().min(1, 'Selecciona una fecha.'),
    status: z.enum(['completed', 'pending', 'cancelled']),
    note: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.status === 'completed' && value.date > new Date().toISOString().slice(0, 10)) {
      context.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'Una transacción futura debe quedar pendiente.',
      });
    }

    if (value.type === 'transfer') {
      if (!value.destinationAccountId) {
        context.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'Selecciona una cuenta destino.',
        });
      }

      if (value.destinationAccountId && value.destinationAccountId === value.sourceAccountId) {
        context.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'La cuenta destino debe ser diferente.',
        });
      }

      return;
    }

    if (value.destinationAmount !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['destinationAmount'],
        message: 'El monto destino solo aplica a transferencias.',
      });
    }

    if (!value.categoryId) {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Selecciona una categoría.',
      });
    }

  });

export type TransactionFormValues = z.input<typeof transactionSchema>;
export type TransactionFormSubmitValues = z.output<typeof transactionSchema>;
export type TransactionTypeFilter = 'all' | Transaction['type'];
export type TransactionStatusFilter = 'all' | Transaction['status'];

export const emptyTransactionValues: TransactionFormValues = {
  type: 'expense',
  amount: 0,
  sourceAccountId: '',
  destinationAccountId: '',
  destinationAmount: undefined,
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'completed',
  note: '',
};

function hasAtMostTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;
}
