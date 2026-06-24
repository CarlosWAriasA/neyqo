import { z } from 'zod';
import type { CurrencyCode } from '../../entities/account.entity';

export const supportedCurrencyCodes = ['DOP', 'USD', 'EUR'] as const satisfies CurrencyCode[];

const currencySchema = z.enum(supportedCurrencyCodes);

export const exchangeRateQuoteSchema = z.object({
  base: currencySchema,
  quote: currencySchema,
  amount: z.coerce.number().positive().max(1_000_000_000).default(1),
});

export type ExchangeRateQuoteInput = z.infer<typeof exchangeRateQuoteSchema>;

export interface ExchangeRateQuoteResponse {
  base: CurrencyCode;
  quote: CurrencyCode;
  amount: number;
  rate: number;
  inverseRate: number;
  convertedAmount: number;
  date: string;
  source: 'frankfurter';
  sourceLabel: string;
  cached: boolean;
}
