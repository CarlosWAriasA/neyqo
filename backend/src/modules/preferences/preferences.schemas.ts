import { z } from 'zod';

export const userPreferencesSchema = z.object({
  primaryCurrency: z.enum(['DOP', 'USD', 'EUR']),
  dateFormat: z.enum(['dd-mm-yyyy', 'yyyy-mm-dd']),
  weekStartsOn: z.enum(['monday', 'sunday']),
  theme: z.enum(['light', 'dark', 'system']),
  hideBalances: z.boolean(),
  budgetAlerts: z.boolean(),
  scheduledPaymentReminders: z.boolean(),
  unusualSpendingAlerts: z.boolean(),
});

export const updateUserPreferencesSchema = userPreferencesSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Envía al menos una preferencia para actualizar.',
);

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
